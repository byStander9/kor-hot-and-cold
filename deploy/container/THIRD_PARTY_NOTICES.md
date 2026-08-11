# Third-party data and software notices

The application code written by this project is distributed under the MIT License included at `/home/node/app/LICENSE` in this image. That license does not replace the licenses of the data, models, or third-party software listed below.

## Data and models

- [Standard Korean Dictionary conversion](https://huggingface.co/datasets/hac541309/stdict_kor): the dataset card declares CC BY-SA 3.0 and also identifies the original National Institute of Korean Language data policy as CC BY-SA 2.0. Used to construct vocabulary, definitions, and derived semantic vectors.
- [NIKL Korean-English Dictionary conversion](https://huggingface.co/datasets/binjang/NIKL-korean-english-dictionary): the dataset card declares MIT. The original National Institute of Korean Language terms remain relevant and must be reviewed alongside the conversion license. Used to construct vocabulary, parts of speech, definitions, and difficulty metadata.
- [intfloat/multilingual-e5-small](https://huggingface.co/intfloat/multilingual-e5-small): MIT. Used offline to generate semantic vectors. Model weights are not included in this image.
- [Kiwi](https://github.com/bab2min/Kiwi): LGPL-3.0. Used offline to generate Korean inflection aliases. The Kiwi runtime and model are not included in this image.

The image contains derived dictionary metadata, aliases, and quantized vectors under `data/demo`. Redistribution and attribution obligations of the original sources continue to apply. The image as a whole must not be described as exclusively MIT-licensed.

## Runtime software

The image includes the runtime portions of Next.js, React, Node.js, and their transitive dependencies. Each package remains under its own license. Exact versions are recorded in `apps/web/package-lock.json` in the source repository.

The pinned source revisions and detailed redistribution decisions are recorded in [`data/sources/data_sources.yml`](https://github.com/byStander9/kor-hot-and-cold/blob/main/data/sources/data_sources.yml).
