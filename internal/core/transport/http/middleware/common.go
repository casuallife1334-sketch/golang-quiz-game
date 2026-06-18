package middleware

import (
	"bufio"
	"fmt"
	"net"
	"net/http"
	"runtime/debug"
	"time"

	"github.com/casuallife1334-sketch/go-quiz-game/internal/core/logger"
	"go.uber.org/zap"
)

const requestIDHeader = "X-Request-ID"

func RequestID() Middleware {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			requestID := r.Header.Get(requestIDHeader)
			if requestID == "" {
				requestID = fmt.Sprintf("%d", time.Now().UnixNano())
			}

			r.Header.Set(requestIDHeader, requestID)
			w.Header().Set(requestIDHeader, requestID)

			next.ServeHTTP(w, r)
		})
	}
}

func Logger(log *logger.Logger) Middleware {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			requestLog := log.With(
				zap.String("request_id", r.Header.Get(requestIDHeader)),
				zap.String("method", r.Method),
				zap.String("url", safeRequestURL(r)),
				zap.String("remote_addr", r.RemoteAddr),
			)

			ctx := logger.ToContext(r.Context(), requestLog)
			next.ServeHTTP(w, r.WithContext(ctx))
		})
	}
}

func safeRequestURL(r *http.Request) string {
	url := *r.URL
	query := url.Query()
	query.Del("clientToken")
	url.RawQuery = query.Encode()
	return url.String()
}

func Trace() Middleware {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			log := logger.FromContext(r.Context())
			writer := newStatusResponseWriter(w)
			startedAt := time.Now()

			log.Debug("incoming HTTP request")
			next.ServeHTTP(writer, r)
			log.Debug(
				"done HTTP request",
				zap.Int("status_code", writer.statusCode),
				zap.Duration("latency", time.Since(startedAt)),
			)
		})
	}
}

func Panic() Middleware {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			log := logger.FromContext(r.Context())

			defer func() {
				if recovered := recover(); recovered != nil {
					log.Error(
						"panic while handling HTTP request",
						zap.Any("panic", recovered),
						zap.ByteString("stack", debug.Stack()),
					)
					http.Error(w, http.StatusText(http.StatusInternalServerError), http.StatusInternalServerError)
				}
			}()

			next.ServeHTTP(w, r)
		})
	}
}

type statusResponseWriter struct {
	http.ResponseWriter
	statusCode int
	written    bool
}

func newStatusResponseWriter(w http.ResponseWriter) *statusResponseWriter {
	return &statusResponseWriter{
		ResponseWriter: w,
		statusCode:     http.StatusOK,
	}
}

func (w *statusResponseWriter) WriteHeader(statusCode int) {
	if w.written {
		return
	}

	w.statusCode = statusCode
	w.written = true
	w.ResponseWriter.WriteHeader(statusCode)
}

func (w *statusResponseWriter) Write(data []byte) (int, error) {
	if !w.written {
		w.WriteHeader(http.StatusOK)
	}

	return w.ResponseWriter.Write(data)
}

func (w *statusResponseWriter) Flush() {
	if flusher, ok := w.ResponseWriter.(http.Flusher); ok {
		flusher.Flush()
	}
}

func (w *statusResponseWriter) Hijack() (net.Conn, *bufio.ReadWriter, error) {
	hijacker, ok := w.ResponseWriter.(http.Hijacker)
	if !ok {
		return nil, nil, fmt.Errorf("response writer does not support hijacking")
	}

	if !w.written {
		w.statusCode = http.StatusSwitchingProtocols
		w.written = true
	}

	return hijacker.Hijack()
}

func (w *statusResponseWriter) Unwrap() http.ResponseWriter {
	return w.ResponseWriter
}
