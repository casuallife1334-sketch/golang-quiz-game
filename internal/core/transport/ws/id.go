package ws

import (
	"crypto/hmac"
	"crypto/rand"
	"crypto/sha256"
	"encoding/hex"
	"strings"
	"unicode"
)

func randomSecret() []byte {
	var bytes [32]byte
	if _, err := rand.Read(bytes[:]); err != nil {
		return []byte("development-client-id-secret")
	}
	return bytes[:]
}

func randomSessionID() string {
	var bytes [16]byte
	if _, err := rand.Read(bytes[:]); err != nil {
		return "client"
	}
	return hex.EncodeToString(bytes[:])
}

func signedSessionID(value string, token string, secret []byte) string {
	value = strings.TrimSpace(value)
	token = strings.TrimSpace(token)

	if !validSessionID(value) || !validSessionToken(value, token, secret) {
		return randomSessionID()
	}

	return value
}

func sessionToken(id string, secret []byte) string {
	mac := hmac.New(sha256.New, secret)
	_, _ = mac.Write([]byte(id))
	return hex.EncodeToString(mac.Sum(nil))
}

func validSessionID(value string) bool {
	if len(value) < 8 || len(value) > 80 {
		return false
	}

	for _, char := range value {
		if unicode.IsLetter(char) || unicode.IsDigit(char) || char == '-' || char == '_' {
			continue
		}
		return false
	}

	return true
}

func validSessionToken(id string, token string, secret []byte) bool {
	expected := sessionToken(id, secret)
	return hmac.Equal([]byte(token), []byte(expected))
}
