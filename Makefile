clean:
	rm -rf dist

test:
	bun test

bundle: clean
	mkdir -p dist
	bun build ./index.ts --compile --target=bun-linux-x64 --outfile dist/crustomize-linux-x64
	bun build ./index.ts --compile --target=bun-linux-arm64 --outfile dist/crustomize-linux-arm64
	bun build ./index.ts --compile --target=bun-darwin-arm64 --outfile dist/crustomize-darwin-arm64
	bun build ./index.ts --compile --target=bun-darwin-x64 --outfile dist/crustomize-darwin-x64
	bun build ./index.ts --compile --target=bun-linux-x64-musl --outfile dist/crustomize-linux-x64-musl

install: bundle
	cp -f dist/crustomize-linux-x64 $(HOME)/.local/bin/crustomize