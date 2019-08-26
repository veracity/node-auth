import glob from "fast-glob"
import fs from "fs"
import path from "path"
import { promisify } from "util"

const pStat = promisify(fs.stat)
const pCopyFile = promisify(fs.copyFile)

interface ICopyFile {
	source: string
	dest: string
}

const filesToCopy: ICopyFile[] = [
	{ source: "package.json", dest: "dist" },
	{ source: "package-lock.json", dest: "dist" },
	{ source: "README.md", dest: "dist" },
	{ source: "LICENSE.md", dest: "dist" }
]

const expandFilePatterns = (cwd?: string) => async (file: ICopyFile) => {
	const files = await glob(file.source, {cwd})
	return Promise.all(files.map(async (resolvedFile): Promise<ICopyFile> => {
		const source = path.resolve(cwd || "./", resolvedFile)
		let dest = path.resolve(cwd || "./", file.dest)
		const destStats = await pStat(dest)
		if (destStats.isDirectory) {
			dest = path.resolve(dest, path.basename(source))
		}
		return { source, dest }
	}))
}

const start = async () => {
	const root = path.resolve(__dirname, "../")
	const resolvedFilesDeep = await Promise.all(filesToCopy.map(expandFilePatterns(root)))
	const resolvedFiles = ([] as ICopyFile[]).concat.apply([], resolvedFilesDeep)
	console.log(`Copying ${resolvedFiles.length} files`)
	await Promise.all(resolvedFiles.map((aFile) => {
		console.log("  ", aFile.source, " -> ", aFile.dest)
		return pCopyFile(aFile.source, aFile.dest)
	}))

	console.log("Done")
}

start().catch((e) => {
	console.error(e)
	process.exit(1)
})
