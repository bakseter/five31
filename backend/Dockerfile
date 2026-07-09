FROM golang:alpine@sha256:0178a641fbb4858c5f1b48e34bdaabe0350a330a1b1149aabd498d0699ff5fb2 AS build

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
