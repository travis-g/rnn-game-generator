# rnn-game-generator

A weekend neural network experiment to generate game titles.

---

I have no idea how any of this magic works, except for the magic I wrote:

- `dump_igdb.js` - The script to use to essentially scrape [IGDB][igdb]. _Do not use this for evil_. You'll need to run it with the following: `API_KEY='YOUR_API_KEY' node dump_igdb.js`. You'll likely burn the full month worth of free API requests, so check the script first to understand it. Back up the file it generates, because provided you have that file, you can pull whatever data from it that you like again later without burning more API requests.

Re-marshal that data from IGDB using jq:

```console
$ jq -r '.games[].name' igdb-<time>.json > games.txt
```

<!-- 📝 The R/RStudio stuff -->

## Frameworks

There are many different frameworks and setups out there, and dependency hell for RNN frameworks is real. After a few hours of trying to get configurations set up on bare metal, enter [docker-torch-rnn](https://github.com/crisbal/docker-torch-rnn), a Docker container designed for playing with [jcjohnson/torch-rnn][torch-rnn] (the lighter and faster successor to Karpathy's [char-rnn][char-rnn]).

## TLDR

Bringing up the Docker image:

```console
$ docker run --rm -it -v ${PWD}:/root/data/ crisbal/torch-rnn:base bash
```

Breaking apart the seed data into something parsable by the network:

```console
$ export FILE=/root/data/games
$ python scripts/preprocess.py \
    --input_txt $FILE.txt \
    --output_h5 $FILE.h5 \
    --output_json $FILE.json
```

Training the network (this'll take a while):

```console
$ th train.lua \
    -input_h5 $FILE.h5 \
    -input_json $FILE.json \
    -model_type lstm \
    -num_layers 3 \
    -rnn_size 256 \
    -dropout 0.2 \
    -batch_size 64 \
    -gpu -1
```

Sample the network (the checkpoint file will probably be different):

```console
$ th sample.lua \
    -checkpoint cv/checkpoint_1700.t7 \
    -length 2000 \
    -gpu -1
```

## Appendix

* [The Unreasonable Effectiveness of Recurrent Neural Networks](https://karpathy.github.io/2015/05/21/rnn-effectiveness/) by Andrej Karpathy.
* [jcjohnson/torch-rnn.git](https://github.com/jcjohnson/torch-rnn).
* https://chunml.github.io/ChunML.github.io/project/Creating-Text-Generator-Using-Recurrent-Neural-Network/
* https://machinelearningmastery.com/text-generation-lstm-recurrent-neural-networks-python-keras/

[igdb]: https://igdb.com
[igdb-api]: https://api.igdb.com
[igdb-api-stats]: https://api.igdb.com/buyer/stats
[igdb-about]: https://www.igdb.com/about
[r-project]: http://cran.us.r-project.org/
[rstudio]: https://www.rstudio.com/
[char-rnn]: https://github.com/karpathy/char-rnn
[torch-rnn]: https://github.com/jcjohnson/torch-rnn
[nvidia-docker]: https://github.com/NVIDIA/nvidia-docker
