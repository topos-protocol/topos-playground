/*
  Breaks a string into lines of length n, respecting word boundaries.

  This code will add line breaks to a long string, breaking it into a
  multiline string. It breaks at spaces, unless doing so would result in a
  line with an abnormally large gap at the end. In that case, it will
  hypenate the last word in the line and continue on the next line.
*/
export function breakText(str: string, maxLineLength: number = 60): string {
  if (maxLineLength <= 0) return str

  // Split the string into words to calculate word length statistics
  let words = str.split(' ')
  let wordLengths = words.map((word) => word.length)

  // Calculate average word length
  let average =
    wordLengths.reduce((sum, length) => sum + length, 0) / wordLengths.length

  // Calculate standard deviation of word length
  let sumOfSquaredDifferences = wordLengths.reduce(
    (sum, length) => sum + Math.pow(length - average, 2),
    0
  )
  let standardDeviation = Math.sqrt(
    sumOfSquaredDifferences / wordLengths.length
  )

  // Determine the maximum word length to allow before breaking
  let maxWordLength = Math.min(maxLineLength, average + standardDeviation)

  let lines: string[] = []
  let line = ''
  let word = ''
  let indentation = ''
  let hasDeterminedIndentation = false
  const whitespace = /[\s\n]/

  for (let i = 0; i < str.length; i++) {
    let char = str[i]
    word += char

    if (whitespace.exec(char) || i === str.length - 1) {
      if (!hasDeterminedIndentation) {
        indentation += char
      }
      if (line.length + word.length < maxLineLength) {
        line += word
        word = ''
      } else {
        if (
          line.length + word.length > maxLineLength &&
          word.length > maxWordLength /* || i === str.length - 1 */
        ) {
          const firstCharacter = word[0]
          const minsplit = Math.max(2, Math.floor(word.length * 0.3))
          const maxsplit = Math.min(
            word.length - 3,
            Math.ceil(word.length * 0.7)
          )
          const middle = maxLineLength - line.length - 1
          if (
            firstCharacter.toLowerCase() != firstCharacter.toUpperCase() &&
            word.length > maxWordLength &&
            middle > minsplit &&
            middle < maxsplit
          ) {
            let part = word.substring(0, middle)
            let remaining = word.substring(middle)
            lines.push(line + part + (remaining.length > 0 ? '-' : ''))
            line = indentation + remaining
            word = ''
          } else {
            lines.push(line.trimEnd())
            line = indentation + word
            word = ''
          }
        } else {
          lines.push(line.trimEnd())
          line = indentation + word
          word = ''
        }
      }
      if (char === '\n') {
        lines.push(line.trimEnd())
        line = ''
        indentation = ''
        hasDeterminedIndentation = false
      } else {
        if (line.length >= maxLineLength || i === str.length - 1) {
          lines.push(line.trimEnd())
          line = ''
        }
      }
    } else {
      hasDeterminedIndentation = true
    }
  }
  if (line) lines.push(line)
  return lines.join('\n')
}
