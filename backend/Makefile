.PHONY: run build linux tidy clean

run:
	go run .

build:
	go build -o bin/truth-or-dare-server .

# 交叉编译到 Linux amd64（部署到远端服务器）
linux:
	GOOS=linux GOARCH=amd64 CGO_ENABLED=0 go build -o bin/truth-or-dare-server-linux-amd64 .

tidy:
	go mod tidy

clean:
	rm -rf bin
