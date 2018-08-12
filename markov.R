# load in libraries
library(tidyverse)
library(tidytext)
library(markovchain)
library(stringr)

getwd

# load in the data
text <- paste(readLines("D:/git/game-generator/games.txt"))

# get rid of empy titles and punctuation, which would complicate matters
text <- text[nchar(text) > 0]
text <- str_replace_all(text, "[[:punct:]]", "")

# Pull a list of all unique words from the seed
terms <- unlist(strsplit(text, ' '))

# Create our Markov chain model
# This is extremely RAM heavy with large numbers of inputs.
# The full 28,000 line file I initially generated ate 11GB of RAM.
# Taking a random sample of 5000 lines should be plenty.
fit <- markovchainFit(data = terms)

# Generate new titles using the chain
titles <- NULL
for(i in 1:20) {
  titles <- c(titles,
            c(paste(markovchainSequence(n=5, markovchain=fit$estimate), collapse=' ')),
            '')
}

outfile <- paste(c("D:/git/game-generator/markov_titles-", format(Sys.time(), "%s"), ".txt"), collapse = "")

write(titles, outfile + ".txt")
