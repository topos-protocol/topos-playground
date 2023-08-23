/*
  Breaks a string into lines of length n, respecting word boundaries.

  This code will add line breaks to a long string, breaking it into a
  multiline string. It breaks at spaces, unless doing so would result in a
  line with an abnormally large gap at the end. In that case, it will
  hypenate the last word in the line and continue on the next line.
*/
export function breakText(str: string, n: number = 60): string {
  if (n <= 0) return str

  // Split the string into words to calculate word length statistics
  let words = str.split(' ');
  let wordLengths = words.map(word => word.length);

  // Calculate average word length
  let average = wordLengths.reduce((sum, length) => sum + length, 0) / wordLengths.length;

  // Calculate standard deviation of word length
  let sumOfSquaredDifferences = wordLengths.reduce((sum, length) => sum + Math.pow(length - average, 2), 0);
  let standardDeviation = Math.sqrt(sumOfSquaredDifferences / wordLengths.length);

  // Determine the maximum word length to allow before breaking
  let maxWordLength = Math.min(n, average + standardDeviation);
  

  let lines: string[] = []
  let line = ""
  let word = ""

  for (let i = 0; i < str.length; i++) {
    let char = str[i]
    if (char === " " || i === str.length - 1) {
      if (line.length + word.length < n) {
        line += word + (i === str.length - 1 && char !== " " ? char : " ")
        word = ""
      } else {
        if ((((line.length + word.length) > n) && ((n - line.length) > maxWordLength)) || i === str.length - 1) {
          let firstCharacter = word[0]
          if (firstCharacter.toLowerCase() != firstCharacter.toUpperCase() && word.length > maxWordLength) {
            let part = word.substring(0, maxWordLength - 1)
            let remaining = word.substring(maxWordLength - 1)
            lines.push(line + part + (remaining.length > 0 ? "-" : ""))
            line = ""
            word = remaining
          }
          line = word + " "
        } else {
          lines.push(line.trim())
          line = word + " "
        }
        word = ""
      }
      if (line.length >= n) {
        lines.push(line.trim())
        line = ""
      }
    } else {
      word += char
    }
  }
  if (line) lines.push(line.trim())
  return lines.join("\n")
}