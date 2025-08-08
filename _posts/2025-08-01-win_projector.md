---
layout: post
title: NBA Matchup Predictor
permalink: /matchup_pred/
date: 2025-08-01
preview_image: /assets/win_projector/four_factor_50.png
description: 
tools: 
  - Python
  - SQLite
  - "`requests`"
  - "`peewee`"
  - "`pandas`"
  - "`nba_api`"
  - "`statsmodels`"

---


Predicting the result of a matchup in any sport is a challenge. Sportsbooks use sophisticated models trained on large quantities of historic data that are frequently updated in real time information like consider injury reports and market behavior. But setting a moneyline or point spread essentially boils down to a data science problem, and with [access to nearly 30 years of NBA data](/shot_chart/), one that I can try to tackle.

The goal of this project is to explore the ability of different ML models to predict the outcome of NBA game based solely on data from each teams games played before the matchup. I'll explore various aspects of feature engineering, compare models of varying complexity, and attempt to distill the key factors that can swing a matchup. But before we start, we must establish baselines to compare our models against.

## Bayes Rate
After defining a ML task, one must determine the best possible performance they should expect to achieve with their model. This expert level performance is what is called the *Bayes rate* in the context of Bayesian statistics, and can be thought of as the inherent uncertainty baked into the problem. For the task of predicting NBA matchups, a sportsbook's moneyline can act as the expert's prediction --- their models are sure to be stronger than ours, so they should provide a good benchmark. 

Historic betting data is more difficult to scrape from the web than the stats provided by stats.nba.com. Many of site that host this data keep it behind paywalls, and the open data that is available is not exhaustive. Thankfully, a kind patron of one of these subscription based sites [published](https://www.reddit.com/r/sportsbook/comments/rslmm3/database_of_nba_spreadsovers_and_almost_all_box/) their betting history data on Kaggle, for public use. I'm not sure the exact source, but doesn't seem to be much variation in matchup favorites amongst the different sportsbook. It was stored in a single, flat CSV, and didn't contain many of the columns used as primary keys in my SQL database, but after some wrangling and cleaning, I was able to insert this dataset into my database for use in this project.

Since the 2007-08 season, the earliest the betting history dataset going back to, the team favored by the sportsbooks (i.e. the team with a negative spread) has won **68.7%** of games. This defines our Bayes rate --- if my model can predict wins with an accuracy above 68.7%, I will deem this project a success. A confusion matrix provides a nice visual for how the sportsbooks' predictions perform for each class (wins and losses). 

<figure class="framed-figure" style="width: 40%;">
  <img src="/assets/win_projector/sportsbook.png" alt="season_four" />
  <figcaption>Expert baseline model based on sportsbooks' predictions.</figcaption>
</figure>

## Simplest Win Projector — Home Team
It is also helpful to define a minimum performance baseline that we are sure our model will perform better than. A simple one would simply rely on home court advantage, which matters a lot in the NBA. Without knowing anything details about a matchup, its not a bad guess to predict that the home team will win. And this is borne out in our dataset: across the nearly ~30,000 total regular season matchups from the 1997-98 to 2024-25 seasons, the home team won 58.8% of the time. We can use this to inform our lower baseline model and define a *Bayesian prior* --- before considering any team specific data, what is the likelihood of observing a win given our real-world, historical knowledge of the NBA. Our simple model will simply predict

$$
P(\text{A beats B}) = 
\begin{cases}
0.588 & \text{if A is home team} \\
1-0.588 = 0.411 & \text{if B is home team} 
\end{cases}
$$ 

and assign a win to the home team every single time.

Since our models predict win probabilities, not just W/L, to score our them we will use three metrics:
* Accuracy score (i.e. # correct predictions / # total predictions)
* Cross-entropy loss (i.e. negative log-likelihood)
* Confusion Matrix (i.e. breakdown of true/false positives/negatives)

While the accuracy score provides a simple way to evaluate how well our model is at performing the task at hand (predicting matchups), the cross-entropy loss is a better gauge of how well-calibrated our classifier is. Cross-entropy penalizes confident wrong predictions, and therefore provides better feedback for a model that predicts the probability of an event occurring. And finally, the confusion matrix shown in above. Since our data has exactly as many true wins as true losses, we should expect similar behavior within each true outcome. 

Our three metrics for this simple model are displayed below.

<!-- ![simple](/assets/win_projector/simple.png) -->

<figure class="framed-figure">
  <img src="/assets/win_projector/simplest.png" alt="season_four" />
  <figcaption>Baseline model based purely on home court advantage.</figcaption>
</figure>

The accuracy of this model is 59%, as expected, and because it predicts a flat win probability, it performs identically across both wins and losses. The loss is large though, relatively speaking --- a completely uninformed model that predicts wins and losses with a constant probability of 50% has a cross-entropy loss of ~0.693. To provide a scale to compare the loss for our future models, we will use the value from this baseline model as the max loss we aim to improve upon. We can now begin to provide our model with team context.



## Season-to-Date Win%
A simple step up from our baseline model is to predict matchups based purely on team win % at the time of game. If Team A has a higher win % than Team B, then our model will predict that Team A will win the matchup, and vice versa. A
softer model may instead produce the probability that Team A/B wins, using the simple [Bradley-Terry (BT) model](https://en.wikipedia.org/wiki/Bradley%E2%80%93Terry_model):

$$
P(\text{A beats B}) = \frac{\text{W}\%_{\rm A}}{\text{W}\%_{\rm A} + \text{W}\%_{\rm B}},
$$

where our classifier would then assign a win to Team A if $$P(\text{A beats B}) > 0.5$$. We expect that a teams season-to-date win percentage will need time to stabilize, so I will predict matchups only after each team has played 10 games (chosen somewhat arbitrarily here, but explored in more detatil below).

<figure class="framed-figure">
  <img src="/assets/win_projector/simple.png" alt="season_four" />
  <figcaption>Bradley-Terry model based on season-to-date win percentage.</figcaption>
</figure>

This simple win model has an overall accuracy of 65%, already not so bad. The loss has been reduced slightly, but can certainly be improved further with stronger feature engineering and a more complex model architecture.

## Four Factor - Running Average
[Dean Oliver](http://www.basketballonpaper.com/), one of the pioneers of basketball analytics, developed the "four factors" as a simple and powerful method to predict basketball success. The four factors aim to isolate the most impactful contributors to winning: shooting, turnovers, rebounding, and free throws. They can be broken down into eight stats, four for offense and four for defense:

<!-- ![eos](/assets/win_projector/eos_four.png){: style="max-width: 48%; height: auto; float: left; padding-right: 50px"} -->

<figure class="float-left-figure">
  <img src="/assets/win_projector/eos_four.png" alt="eos" />
  <figcaption>Predicting end-of-season win percentage using linear model trained on the four factors. Data from 1997-98 to 2024-25 NBA seasons.</figcaption>
</figure>


* Effective Field Goal Percentage
* Turnover Percentage
* Offensive Rebound Percentage
* Free Throw Rate
* Opponent's Effective Field Goal Percentage
* Opponent's Turnover Percentage
* Defensive Rebound Percentage
* Opponent's Free Throw Rate



It's well known that NBA team performance in these eight statistics correlates very well with end of season win percentage. Our linear regression confirms this, with all features exhibiting high statistical significance ($$p \ll 0.05$$). This begs the question, do these stats hold the same predictive power on a game-by-game basis?

To test this, I first scraped stats.nba.com of team box score data extending from 1997-98 to 2024-25, exclduing the two strike shortened seasons and the COVID season (see my post on the [evolution of the NBA shot chart](/shot_chart/) for details on this process). This data set has all the information I need to calculate the rolling average four factor statistics at any point in a season for any time; these will be the features I use in a generalized linear model (i.e. logistic regression model) to predict matchup outcomes. The feature matrix is illustrated below:


| Matchup | Team A Four Factors (Off.) | Team A Four Factors (Def.) | Team B Four Factors (Off.) | Team B Four Factors (Def.) | Context |
|------------|-----------|------------|---------|---------|---------|
| <span style="font-size: 12px;">$$A_1$$ vs. $$B_1$$</span> | ▇▁▅▃ | ▆▂▃▅ |  ▇▆▃▁ | ▄▂█▁ | ▄▂█▁ |
|  <span style="font-size: 12px;">$$A_2$$ vs. $$B_2$$</span>  |▃▆▁▇ | ▄▁▆▃ | ▅▁▄▇ | ▂▇▃▁ | ▄▂█▁ |
| ... | ... | ... | ... | ... | ... |
|  <span style="font-size: 12px;">$$A_N$$ vs. $$B_N$$</span>  |▃▆▁▇ | ▄▁▆▃ |  ▅▁▄▇ | ▂▇▃▁ | ▄▂█▁ |

Each row represents a single matchup, and the columns correspond to the 2 $$\times$$ 8  four factor stats for each team, averaged over all games within the season leading up to the matchup. I also add some "context" stats that I expect will help inform the W/L decision: season-to-date win percentage for each team, as used in the previous model, whether Team A or B is at home (one-hot encoded), and how many days of rest both Team A and Team B have. In total, there were ~50,000 rows of data.

Generating this feature matrix required some simple processing of the basic box score stats, a self-join on `game_id` with a filter to remove duplicates (to calculate the defensive four factors), a running average aggregation to generate season-to-date statistics, and another self-join on `game_id` to combine the aggregated data for both teams in each matchup. The initial query of the box score data was done using SQL, but much of the heavy lifting was done in Python, using `pandas`. 

Here are the results of the trained logistic regression model on the test data (75%/25% split). Again, all features were statistically significant ($$p \ll 0.05$$).

<figure class="framed-figure">
  <img src="/assets/win_projector/four_factor.png" alt="season_four">
  <figcaption>Logistic regression model based on season-to-date four factor stats (10 game cut off).</figcaption>
</figure>

While the accuracy improved only modestly, the cross-entropy loss has reduced more substantially, indicating that this model is more calibrated to predict wins and losses than the simple win percentage based BT model. The form of the BT model can be simply related to the sigmoid function used to generate probabilities in logistic regression, if team strength is instead reparametrized as an exponential. In this case, team win percentage is not the most appropriate metric to use, and something like the [ELO rating](https://en.wikipedia.org/wiki/Elo_rating_system) common in chess would be better. [Calculating ELO rating for NBA teams](https://www.reddit.com/r/nba/comments/1j2do9p/i_calculated_the_nba_elo_ratings_for_202425/) would be an interesting extension to this simple BT model.


<!-- ![eos](/assets/win_projector/stabilize.png){: style="max-width: 48%; height: auto; float: left; padding-right: 50px"} -->

<figure class="float-left-figure">
  <img src="/assets/win_projector/stabilize.png" alt="eos_four">
  <figcaption>Stabilization of the running average four factor stats, as represented as the mean deviation across all teams in the data set from their values at end-of-season.</figcaption>
</figure>


Just as with win percentage model, I imposed the constraint that each team must have played at lease 10 games to be part of the data set, to give some time for the four factor stats to stabilize. Empirically, it appears that the four factor stats stabilize at different rates (see plot on left). But after around 10 games, on average, each stat is within 10% of its end of season value, implying some level of stabilization. Choosing a larger cut off could improve the model, but at the cost of being able to predict fewer outcomes within a given season. We can explore this balance using cross-validation.

### Choosing a Minimum Games Played Cutoff

<figure class="center-figure">
  <img src="/assets/win_projector/running_avg_cut off_bts.png" alt="cut off">
  <figcaption>Performance of model trained on data using different minimum games played cut offs.</figcaption>
</figure>

Two choose an optimal minimum game cut off, I further split the training data into a smaller training set and validation set (75%/25% split, once again). I trained the model on subsets of the training data set, pruning to keep only matchups where both teams played a set minimum number of games, and evaluted the result on the validation data. After 60 repeats, I plotted the training/validation accuracy and loss versus the minimum game cut off used, shown above.

The running average stats for each team become more robust as the cut off increases, which results in an improvement in the model's performance on both the training and validation data sets. However, at a certain point, the training data size becomes too small and the predictive power of the model starts to deteriorate, resulting in poorer performance on the validation data. 

It's interesting that the performance on the training data seems to somewhat plateau between the 10 and 30 game cut offs. Perhaps this suggests that there are two stages of stabilization: there is a lot of early season variation that flattens out quickly, followed by more long-term stabilization, perhaps related to lineup adjustment and trades. This seems challenging to capture with our model and would likely require more sophisticated time series modeling to account for.


In any case, just as our validation results predicts, the model trained using a 50 game cut off indeed performs best on the test data.


<figure class="framed-figure">
  <img src="/assets/win_projector/four_factor_50.png" alt="season_four_50">
  <figcaption>Logistic regression model based on season-to-date four factor stats (50 game cut off).</figcaption>
</figure>f

While the accuracy score matches our Bayes' rate of ~69%, I'm not sure that imposing a 50 game cut off model really represents an improved model. The lower loss implies that the predictions are better calibrated, but only being able to predict games 51 through 82, as opposed to 11 through 82, is fairly constraining for only a 3% increase in the model accuracy from the 10 game cut off model. And since the sportsbooks' predictions don't require such a cuttoff, I'm hesitant to say this model matches their performance.

This does highlight the important 

<!-- ## Four Factor + Rolling Average
The issue with the current set up is that temporal information is highly suppressed by using a rolling average. If a team makes a midseason trade, loses a key player to injury, or is just in a cold/hot streak (the existence of such a thing being left for another discussion), we would expect a change in their likelihood of winning any given matchup. This would be reflected in the team's season-long running averages, but the strength of this signal may be small depending on when these changes occur. A way to capture this temporal data is to include a team's *rolling* average over the previous $$n$$ games in our feature matrix.


<figure class="float-left-figure">
  <img src="/assets/win_projector/cavs_15.png" alt="eos_four">
  <figcaption>Example of rolling vs. running average effective field goal perctange over course of season, 2014-15 Cleveland Caveliers.</figcaption>
</figure>


A recent example that comes to mind is during the 2014-15 season, the Cleveland Cavaliers traded for three players that ended up being massive contributors to their NBA finals found team: J.R. Smith, Iman Shumpert, and Timofey Mozgov. You can clearly see their impact represented in the 10 game rolling average of the team effective field goal percentage, shown on the left. After a a short adjustment period resulting in a four gamem post-trade losing streak, the Cavs went on to win 12 straight with thier new additions, and their good play can be captured by the a large spike in the team 
 -->


$$
\sim
$$



