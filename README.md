# cvh

## Development

### Installs

- `git`: Suggest [installing Apple XCode](https://developer.apple.com/xcode/).
- `PostgreSQL`
- In the backend directory:
    - [Install `uv`](https://docs.astral.sh/uv/getting-started/installation/) using any supported installation method.
    - Create a `uv` virtual environment with the appropriate python version via `uv venv --python $(cat .python-version)`.
    - Activate the environment with `source .venv/bin/activate`.
    - Install requirements with `uv sync`.
- In the frontend directory:
  - `nodejs/npm`: Suggest [installing nvm](https://github.com/nvm-sh/nvm#installing-and-updating) and then using it to install the appropriate node version: `nvm install`.
    - `` nvm install `cat .nvmrc`  ``
    - `` nvm use `cat .nvmrc`  ``
    - Install requirements with `npm install`.

### Running the development servers

- In the backend/core directory:
    - Add and fill a .env copied from the .env.example. You can generate a Django secret key by running `python -c 'from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())'`
    - Before first running the server of if any changes to the database models have been made
        - `python manage.py makemigrations` to commit the database migrations and ` python manage.py migrate` to apply the migrations.
    - To run the server
        - `python manage.py runserver`.
- In the frontend directory:
    - Add and fill a .env copied from the .env.example.
    - With the python server running, run `npm run gen-api-types` to update the types generated from the OpenAPI schema.
    - To run the server
        - `npm run dev`

