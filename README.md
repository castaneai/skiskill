# kksk

Capture dmkt right now!

## Requirements

- Docker

## Usage

Let's capture 284 seconds(4:44) of the video(partId: 22863003).

```sh
$ make build
$ docker run --rm -p 8080:8080 -e SESSION=xxxxx kksk
$ open http://localhost:8080/?partId=22863003&second=284
```

![output](./example.png)

### env variables

- `SESSION`: certificate_session_id
