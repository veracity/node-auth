# Development
TODO
* Fetch and cache identity metadata in the background
* Structure of stored access tokens etc
* Better test coverage for the library
* Error handling best practice
* Test passed in functions like `onBeforeLogin` etc

## Development

## Testing
We rely on Typescript as a base quality measurement. In addition, we use Jest and Supertest for unit testing.
To run all tests, run `npm test`.

## Release
To manually create a new release, do the following: 
1) Make sure tests pass
2) Bump the version in the `package.json` (we follow [semver](https://semver.org/))
3) Run `npm run build`
4) Run `cd dist`
5) Run `npm publish --dry-run` to test the publish. Have a quick look at the output and see that it makes sense
6) Run `npm publish`

[TODO] In the future, when you push to master, the package will automatically publish a new minor version of the package to NPM.