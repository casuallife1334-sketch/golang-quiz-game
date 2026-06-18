package ws

import "testing"

func TestSignedSessionIDAcceptsValidToken(t *testing.T) {
	secret := []byte("test-secret")
	id := "client_123456"
	token := sessionToken(id, secret)

	if got := signedSessionID(id, token, secret); got != id {
		t.Fatalf("expected signed session id %q, got %q", id, got)
	}
}

func TestSignedSessionIDRejectsInvalidToken(t *testing.T) {
	secret := []byte("test-secret")
	id := "client_123456"

	if got := signedSessionID(id, "invalid-token", secret); got == id {
		t.Fatalf("expected invalid token to be rejected")
	}
}

func TestSignedSessionIDRejectsInvalidID(t *testing.T) {
	secret := []byte("test-secret")
	id := "../client_123456"
	token := sessionToken(id, secret)

	if got := signedSessionID(id, token, secret); got == id {
		t.Fatalf("expected invalid id to be rejected")
	}
}
