package ws

import (
	"crypto/rand"
	"encoding/hex"
)

func randomSessionID() string {
	var bytes [16]byte
	if _, err := rand.Read(bytes[:]); err != nil {
		return "client"
	}
	return hex.EncodeToString(bytes[:])
}
