# Real-time-user-Insights
Line charts depicting current user counts

## Contents

A folder named `api`, which has `api.py`, which simulates the official API.
(As of now it gives off random values from 0-200)

```
$ gunicorn api:app
```

A folder `chart_plotter`, which has the file `app.js`, node_modules, etc.

```
$ npm install

$ node app.js 
```


## Tips

- To switch between time ranges, select the drop-down menu and select the desired range.
- Refresh once to update to latest count.
