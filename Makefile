.PHONY: build run

build:
	docker build -t kksk .

run:
	docker run -it --rm -v $(CURDIR):/app -e SESSION=$(SESSION) -e PART=$(PART) kksk $(ARGS)