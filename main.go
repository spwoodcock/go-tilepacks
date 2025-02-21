package main

import (
	"io"
	"fmt"
	"mime"
	"net/http"
)

func withHeaders(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		next.ServeHTTP(w, r)
	})
}

func proxyHandler(w http.ResponseWriter, r *http.Request) {
	target := r.URL.Query().Get("url")
	if target == "" {
		http.Error(w, "Missing 'url' query parameter", http.StatusBadRequest)
		return
	}

	resp, err := http.Get(target)
	if err != nil {
		http.Error(w, "Failed to fetch target", http.StatusBadGateway)
		return
	}
	defer resp.Body.Close()

	w.Header().Set("Content-Type", resp.Header.Get("Content-Type"))
	w.Header().Set("Access-Control-Allow-Origin", "*")

	// Correct function: io.Copy instead of http.Copy
	if _, err := io.Copy(w, resp.Body); err != nil {
		http.Error(w, "Failed to copy response body", http.StatusInternalServerError)
	}
}

func main() {
	// Register TypeScript MIME type
	mime.AddExtensionType(".ts", "application/javascript")

	fs := http.FileServer(http.Dir("./assets"))
	http.Handle("/", withHeaders(fs))
	http.HandleFunc("/proxy", proxyHandler)

	fmt.Println("Server running at http://localhost:8080")
	if err := http.ListenAndServe(":8080", nil); err != nil {
		fmt.Println("Failed to start server:", err)
	}
}
