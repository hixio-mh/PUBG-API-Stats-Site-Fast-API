# NodeJS, FastAPI (python) and MySQL based PUBG Stats Site
- Consists of a front-end (Fastify with Nunjucks) and a API - FastAPI + MySQL
- This is essentialy the following project: [https://github.com/dstlny/PUBG-API-Stats-Site](https://github.com/dstlny/PUBG-API-Stats-Site), just written in a differnt frameworks using differnt tools.

# Getting started - things that probably need to be done
- Any version of Python3 should work.
- Install the python dependencies using `pip install -r requirements.txt`.
- Install node dependencies using `npm install`.
- Setup MySQL and change the settings within `api/initialiser.py` to reflect your local database.
    - This will automatically migrate the models over to your database.
- Change `API_TOKEN` within `api/settings.py` to your PUBG API Token.
- Start django first using `python main.py`
- Start node using `node server` or `nodemon server` if you have nodemon installed.
- Navigate to localhost, and search away.