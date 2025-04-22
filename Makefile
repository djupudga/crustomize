clean:
	rm -rf dist

bundle: clean
	mkdir -p dist
	bun build ./index.ts --compile --target=bun-linux-x64 --outfile dist/crustomize-linux-x64
	bun build ./index.ts --compile --target=bun-darwin-arm64 --outfile dist/crustomize-darwin-arm64

install: bundle
	cp -f dist/crustomize-linux-x64 $(HOME)/.local/bin/crustomize