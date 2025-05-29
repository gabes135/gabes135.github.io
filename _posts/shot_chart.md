---
layout: default
title: Evolution of the Shot Chart
permalink: /shot_chart/
---

# Evolution of the NBA Shot Chart


<video width="640" height="360" controls autoplay loop muted playsinline>
  <source src="{{ '/assets/sports/hm_gif.mp4' | relative_url }}" type="video/mp4">
  Your browser does not support the video tag.
</video>


I was sent a link to a [GitHub repo](https://github.com/DomSamangy/NBA_Shots_04_25) containing every shot attempted in the NBA from the 2004 to 2024 season, and felt the gears start turning in my head. With such a rich, dense set of data, there was sure to be some interesting insights to be gained. The data was stored in CSV files, one per season, which made loading, processing, and visualizing the year by year data difficult. After some scouring, I found another option, [`nba-sql`](https://github.com/mpope9/nba-sql), a Python based library that can be used to scrape stats.nba.com of all sorts of data. What was appealing about this library is that the short chart results, as well as player game logs and game-by-game play-by-play data, could be stored in an SQLite database. In addition to being better equipped to handle and query the large quantity of data, this approach also provided a nice playground to brush up on my SQL and learn about object-relational mapping (ORM). 

## `nba_api`
The first task was to get familiar with the `nba-sql` library. This library draws quite a lot from the popular [`nba_api`](https://github.com/swar/nba_api) Python library, which I have used for simple queries over the years. Both use the Python `requests` package to scrape the NBA's stats webpages for data (from 'endpoints' - undocumented locations within stats.nba.com containing undocumented sets of data), but `nba_api` simply returns the results of these queries as pandas DataFrames. This is really only helpful for 'lightweight' data analysis, highlighting the main purpose of `nba_api`:
> A significant purpose of this package is to continuously map and analyze as many endpoints on NBA.com as possible. The documentation and analysis of the endpoints and parameters in this package are some of the most extensive information available. At the same time, NBA.com does not provide information regarding new, changed, or removed endpoints.

## `nba-sql`
The `nba-sql` library allows you to scrape data from ten different endpoints {#endpoints}:
* player_season
* player_game_log
* play_by_play
* play_by_playv3
* pgtt
* shot_chart_detail
* game
* event_message_type
* team
* player

In all cases, the general framework of collecting the data is the same:
** Determine a set of parameters for the query (e.g. game id number for player_game_log or player id, team id, season trio for short_chart_detail). 
** Use the `requests` package to `get` the data contained in the endpoint. These parameters, along with some predefined defaults parameters, are fed into the `get` function, which essentially tacks them on in a specific way to the end of https://stats.nba.com/stats/{endpoint}/. A 'header' is also passed along in the request, which is a list of settings that are used to trick stats.nba.com that the site is being visited by a computer browser, rather than a data-scraping bot. My understanding is that many websites that host stats are okay with data scraping, as long as some guidelines are met (minimum time between requests, for example). If you aren't careful, yor IP address can be blocked from accessing a site (this has happened to me with baseball-reference many times...).
** The data is generally stored in some type of table. After identifying the columns of interest (this is where `nba_api` comes in), the desired values from each row in the table are stored in an array.
** This array (list of rows) is then `populate`d into an SQLite database `nba_sql.db`. This is done using the python library [peewee](https://docs.peewee-orm.com/en/latest/). This is my first experience using an ORM - in my [previous data scraping projects](/contracts/), the data sets were either small or the data structures were simple enough to use flat CSV files. An ORM allows you to use Python object oriented programing principles to create, insert data into, and modify SQL databases. This is particularly useful for relationship databases, where the rows of the various [tables](#endpoints) are related to each other using keys (player id, team id, and game id being examples).


$$
\tilde{}
$$



