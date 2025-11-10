import { customAlphabet } from "nanoid"
const nano = customAlphabet("123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz", 10)
export default function newSlug() { return nano() }