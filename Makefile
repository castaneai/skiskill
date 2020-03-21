.PHONY: build run

build:
	docker build -t skiskill .

run:
	docker run -it --rm -v $(CURDIR):/app -e SESSION=$(SESSION) -e PART=$(PART) skiskill