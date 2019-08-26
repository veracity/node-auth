import glob from "fast-glob"
import fs from "fs"
import path from "path"
import { promisify } from "util"
import { parse, typesToMarkdown } from "./typeParser"

const pReadFile = promisify(fs.readFile)
const pWriteFile = promisify(fs.writeFile)

const parseTypes = async (inDir: string) => {
	const typeFiles = await glob("*.ts", {cwd: inDir})
	return Promise.all(typeFiles.map(async (typeFile) => {
		const fileContent = await pReadFile(path.resolve(inDir, typeFile), "utf8")
		return parse(fileContent)
	}))
}
const insertTypesInReadme = async (stringToInsert: string, fileName: string) => {
	const content = await pReadFile(fileName, "utf8")
	const newContent = content.replace(/<!-- types -->[\s|\S]*?<!-- \/types -->/i,
		"<!-- types -->\n"+stringToInsert+"\n<!-- /types -->")
	await pWriteFile(fileName, newContent, "utf8")
}

const start = async () => {
	const root = path.resolve(__dirname, "../")
	const parsedTypes = await parseTypes(path.join(root, "src", "interfaces"))
	const typesAsMarkdown = parsedTypes.map((props) => typesToMarkdown(props)).join("\n")
	await insertTypesInReadme(typesAsMarkdown, path.resolve(root, "README.md"))
}

start().catch((e) => {
	console.error(e)
	process.exit(1)
})
