FROM golang:alpine@sha256:3ad57304ad93bbec8548a0437ad9e06a455660655d9af011d58b993f6f615648 AS build

WORKDIR /app

RUN apk add --no-cache ca-certificates

ENV GO111MODULE=on CGO_ENABLED=0 GOOS=linux

COPY go.mod go.sum ./
RUN go mod download

COPY . .
RUN go build -o ./out/executable .


FROM scratch

COPY --from=build /app/out/executable /executable
COPY --from=build /etc/ssl/certs/ca-certificates.crt /etc/ssl/certs/

USER 65534:65534

EXPOSE 8080

ENTRYPOINT ["/executable"]
