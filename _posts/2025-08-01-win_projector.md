---
layout: post
title: NBA Matchup Predictor
permalink: /matchup_pred/
date: 2025-08-01
preview_image: 
description: 
tools: 
  - Python
  - SQLite
  - "`requests`"
  - "`peewee`"
  - "`pandas`"
  - "`nba_api`"
---


Predicting the reuslt of a matchup in any sport is a challenge. Sportsbooks use sophisticated models trained on large quantities of historic data, that are constantly updated with real time data, injury reports, and market behvaior. But setting a moneyline or point spread essentially boils down to a data science problem, and with [access to nearly 30 years of NBA data](/shot_chart/), one that I can try to tackle.

The goal of this project is to explore the ability of different ML models to predict the outcome of NBA game based solely on data from each teams games played before the matchup. I'll explore various aspects of feature engineering, compare models of varying complexity, and attempt to distill the key factors that can swing a matchup. But before we start, we must establish a baseline to compare against our model.

## Simple Win Projector — Win%
To assess if our matchup predictor model is any good, we first need to gauge the difficulty of our problem. We do this by assuming the simplest model one could use to determine the outcome of matchup, one based purely on team win % at the time of game. If Team A has a higher win % than Team B, then our model would predict that Team A will win the matchup, and vice versa. A
softer baseline model may instead produce the probability that Team A/B wins, using the simple [Bradley-Terry (BT) model](https://en.wikipedia.org/wiki/Bradley%E2%80%93Terry_model):

$$
P(\text{A beats B}) = \frac{\text{W}\%_{\rm A}}{\text{W}\%_{\rm A} + \text{W}\%_{\rm B}},
$$

where our classifier would then assign a win to Team A if $$P(\text{A beats B}) > 0.5$$. Season win percentage needs time to stabilize, so I will predict matchups only after each team has played 10 games.

To score our various models, we will use three metrics:
* Accuracy score (i.e. # correct predictions / # total predictions)
* Cross-entropy loss (i.e. negative log-liklihood)
* Confusion Matrix (i.e. breakdown of true/false positives/negatives)

While the accuracy score provides a simple way to evaluate how well our model is at perfomring the task at hand (predicting matchups), the cross-entropy loss is a better gauge of how well-calibrated our classifier is. The cross-entropy penalizes confident wrong predictions, and therefore is more equipped to provide feedback for a model that predicts the probability of an event occuring. And finally, the confusion matrix provides a nice visual of how our model performs for each class - since our data will have exactly as many true wins as true losses, we should expect similar behavior within each true outcome. 

Our three metrics for this simple model are displayed below.

<!-- ![simple](/assets/win_projector/simple.png) -->

<figure class="framed-figure">
  <img src="/assets/win_projector/simple.png" alt="season_four">
  <figcaption>Bradley-Terry model based on season-to-date win percentage.</figcaption>
</figure>

The simple win model performs nearly identically across both wins and losses and has an overall accuracy of of 67%, ar already not so bad. The loss is large though, relatively speaking (i.e. as compared to a value of ~0.693, corresponding to a model that predicts wins and losses with a constant probability of 50%).

The goal is to design a model that beats these metrics, and I will explore a few different approaches in the remainder of this post.

## Four Factor
[Dean Oliver](http://www.basketballonpaper.com/), one of the pioneers of basketball analytics, developed the "four factors" as a simple and powerful method to predict basketball success. The four factors aim to isolate the most impactful contributors to winning: shooting, turnovers, rebounding, and free throws. They can be broken down into eight stats, four for offense and four for defense:

![eos](/assets/win_projector/eos_four.png){: style="max-width: 48%; height: auto; float: left; padding-right: 50px"}

* Effective Field Goal Percentage
* Turnover Percentage
* Offensive Rebound Percentage
* Free Throw Rate
* Opponent's Effective Field Goal Percentage
* Opponent's Turnover Percentage
* Defensive Rebound Percentage
* Opponent's Free Throw Rate



It's well know that NBA team performance in these eight statistics correlates very well with end of season win percentage. Our linear regression confirms this, with all features exhibiting high statistical significance ($$p \ll 0.05$$). This begs the question, do these stats hold the same predictive power on a game-by-game basis?

To test this, I first scraped stats.nba.com of team boxscore data extending to 1997 (see my post on the [evolution of the nba shot chart](/shot_chart/) for details on this process). This data set has all the information I need to calculate the rolling average four factor statistics at any point in a season for any time; these will be the features I use in a generalized linear model (i.e. logistic regression model) to predict matchup outcomes. The feature matrix is:


| Matchup | Team A Four Factors (Off.) | Team A Four Factors (Def.) | Team B Four Factors (Off.) | Team B Four Factors (Def.) | Context |
|------------|-----------|------------|---------|---------|---------|---------|
| $$A_1$$ vs. $$B_1$$ | ▇▁▅▃ | ▆▂▃▅ |  ▇▆▃▁ | ▄▂█▁ | ▄▂█▁ |
| $$A_2$$ vs. $$B_2$$  |▃▆▁▇ | ▄▁▆▃ | ▅▁▄▇ | ▂▇▃▁ | ▄▂█▁ |
| ... | ... | ... | ... | ... | ... | ... |
| $$A_N$$ vs. $$B_N$$  |▃▆▁▇ | ▄▁▆▃ |  ▅▁▄▇ | ▂▇▃▁ | ▄▂█▁ |

Each row represents a single game in a single season, and the columns correspond to the 2 $$\times$$ 8  four factor stats for each team, averaged over all games within the season leading up to each machup. I also add some 'context' stats that I expect will help inform the W/L decision: season-to-date win percentage for each team used in the previous model, as well as whether Team A or B is at home (one-hot encoded) and how many days of rest Team A and B have. 

Generating this feature matrix required some simple processing of the basic boxscore stats, a self-join on  `game_id` with a filter to remove duplicates (to calculate the defensive four factors), a rolling average aggregation to generate season-to-date statistics, and another self-join on  `game_id` to combine the aggregated data for both teams in each matchup. The intial query of the boxscore data was done using SQL, but much of the heavy lifting was done in Python, using `pandas`. 

Here are the results of the trained model on the test data (75-25 split):

<!-- #### Four Factors
![season_four](/assets/win_projector/season_four.png)
 -->
<figure class="framed-figure">
  <img src="/assets/win_projector/season_four.png" alt="season_four">
  <figcaption>Logisitc regression model based on season-to-date four factor stats.</figcaption>
</figure>

While the accuracy only slighlty improves, the cross-entropy loss has reduced more substnatially, indicating that this model more calibrated to predict wins and losses than the simple win perctange based BT model. Perhaps with a better metric to describe a teams stength, like [ELO rating](https://en.wikipedia.org/wiki/Elo_rating_system), the returned prbabilities of the BT model would be more accurate.

![eos](/assets/win_projector/stabilize.png){: style="max-width: 48%; height: auto; float: left; padding-right: 50px"}

Just as with the simple win percentage model, I imposed the constraint that each team must have played at lease 10 games to be part of the data set, to give some time for the four factor stats to stabilize. Empirically, it appears that each of the four factor stats stabilize at their own rate (see plot on left). But after around 10 game, on average, each stat is within 10% of the end of season value, implying some level of stabilization. Choosing a larger cutoff would likely improve the model, but at the cost of being able to predict fewer outcomes within a given season. This balance could be something to explore in more detail later (perhaps using cross-validation). 


## Four Factor +
The issue with the current set up is that the temporal information about a time 

$$
\tilde{}
$$



