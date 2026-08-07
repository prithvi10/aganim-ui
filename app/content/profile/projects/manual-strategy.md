---
title: Technical analysis of US Stock market
summary: This project performs technical analysis on stock market data of US stock market. It answers the standard question ; Can we beat the stock market by taking intelligent positions to maximize the profits?
tags:
  - Technical Analysis
  - Stock market
date: '2022-05-10T00:00:00Z'

# Optional external URL for project (replaces project detail page).
external_link: ''

image:
  caption: Photo on Unsplash
  focal_point: Smart

links:
  - icon: linkedin
    icon_pack: fab
    name: Connect
    url: https://www.linkedin.com/in/prithviraj-pawar-69058ab5/
url_code: ''
url_pdf: ''
url_slides: ''
url_video: ''

# Slides (optional).
#   Associate this project with Markdown slides.
#   Simply enter your slide deck's filename without extension.
#   E.g. `slides = "example-slides"` references `content/slides/example-slides.md`.
#   Otherwise, set `slides = ""`.
---
## Overview
This project performs technical analysis on stock market data of US stock market. It answers the standard question ; Can we beat the stock market by taking intelligent positions to maximize the profits? For improving the profits it uses 3 types of market indicators to define LONG and SHORT trading rules. This project is built using Python3, Pandas and Numpy and utilizes some hidden code modules like Market Simulation whose implementation I have linked to github. The project's entire code can be found on my github repository.

## Assumptions and Pre-requisites
Following gives a description of the function of each of the imports

##### util.get_data()
Provides CSV files with stock market data for multiple stock symbols in US stock market

##### marketsimcode.marketsim()
Provides a code to simulate market. This function accepts orders which contain stock orders for a particular symbol and a particular date,
initial investment as "start_val", broker commission as "commission" and impact as "impact".

#### ManualStrategy
This is a portfolio strategy that was created by a human by looking at the indicators and fixing their value manually. This is used for comparison with the StrategyLearner performance and returns.

#### The stock symbols

The stock symbols are words which represent the stock name on US stock market. Also each of the symbols must be present inside the data folder.

#### In sample Period
The in-sample period is January 1, 2008 to December 31, 2009.

#### Out sample Period
The out-of-sample/testing period is January 1, 2010 to December 31, 2011.

#### initial amount
Starting cash is $100,000.

#### Stock Symbol
Stock symbol for testing and training: JPM
### Positions
Allowable positions are: 1000 shares long, 1000 shares short, 0 shares

## Technical Indicators

Technical Indicators are heuristics used to analyze the stock market and its trends using historical data and trading volume. These technical indicators are useful in predicting the market in the future. For this project I had used the following technical indicators.

### Simple Moving Average

It’s the rolling average for the last n days. It can help in understanding if a portfolio price will continue or if it will reverse the ongoing trend. SMA smooths the volatility of the stock and makes it easier to see the long trend of the stock. The longer the window, the smoother the prediction. An upward SMA can give a buying signal and a downward trend can give a sell signal. Following is the chart that shows SMA of the stock JPM from January 2008 to January 2010.
![SMA](simple-moving-average.png "SMA")

### Bollinger Bands
It uses SMA to create two bands above and below the SMA based on the standard deviation of the stock price. The upper bands and lower bands are 2 standard deviations +/- from the 20-day simple moving average.

Formula:

𝑈𝑝𝑝𝑒𝑟 𝐵𝑎𝑛𝑑 = 𝑆𝑀𝐴 + 2 ∗ sigma

𝐿𝑜𝑤𝑒𝑟 𝐵𝑎𝑛𝑑 = 𝑆𝑀𝐴 − 2 ∗ sigma

Where:

SMA: Simple moving average for n periods
sigma : Standard deviation from SMA

Bollinger bands tell us the boundary of a stock to change trend. If the stock price crosses the upper Bollinger band, then it’s a buy opportunity. Conversely when stock price crosses the lower Bollinger band then it’s a sell opportunity.
![BB](bollinger-bands-zoomed-in.png "Bollinger Bands")

### Momentum

It indicates the pace with which market changes. It helps us to determine the strength of a trend. How long lasting it the trend.

Formula: 𝑀𝑜𝑚𝑒𝑛𝑡𝑢𝑚 = 𝑃 − 𝑃𝑥

Where: P = Latest price, Px = Price x number of days ago

It is used by investors to go long when there is an upward momentum and go short when there is a downward momentum.
![BB](momentum.png "Momentum")

## Manual Strategy

<Manual Strategy Introduction>
In the manual strategy I gave equal weightage to Bollinger Bands, Momentum and Simple Moving Average. I used the followings values for each of them for Buy and Sell signal. I came up with these values using brute force methods and decided to use them based on market's historical data.

**Buy Signal**

If *Bollinger Band Indicator <-0.08 AND momentum < -0.03 AND Price[t]-Simple Moving Average <-0.02*

**Sell Signal**

If *Bollinger Band Indicator >0.08 AND momentum >0.03 AND Price[t]-Simple Moving Average >0.02*;

### Why I think these are good signals?

For ***Buy Signal***, importantly all these values are negative which tell us that the daily price has gone down below normal thresholds.
- Prices less than SMA indicate that the prices are lower than normal trend n days before hence, price may bounce back.
- Momentum less than 0 indicates a Bearish trend and tells that the market is significantly down and may rise back to the old price.
- Bollinger Band index less than 0 indicates that the current price is very close to the lower Bollinger band and negatively away than SMA. Hence, it may also bounce back.
Since I use these indicators together, they create a strong buying signal.

Conversely for a ***Sell signal***,
- I check that the prices are more than SMA.
- The momentum is bullish, and market is stronger.
- Bollinger Band index greater than 0 indicates that the current price is very close to upper Bollinger band and positively away from SMA. Also, I use these indicators together, they create a strong selling signal and may result into some profits.

The actual thresholds for these signals were decided based on trial and error on JPM data for in-sample period. I chose the values that gave better results in-sample period by analyzing the in-sample data.

### Results
Below are the charts for in sample and out sample data comparing manual and benchmark strategies for JPM stock. Before the market dips it takes a SHORT position and LONG position before market peaks. The blue and black vertical lines in the chart indicate LONG and SHORT positions.
Benchmark is the Actual JPM stock price for the specified duration.
As you can see that my Manual Strategy works better than the benchmark using the above values for Stock indicators. However for Out-sample period it fairly improves the returns.
![BB](ManualStrategy1.png "Manual Strategy - Training Data")
![BB](ManualStrategy2.png "Manual Strategy - Testing Data")
### Speed of Calculation
Manual Strategies are calculated by considering the historical data of the stock prices, thats what technical analysis means. However considering large portion of historical data and making decisions is not always faster for a human. Humans are good at fundamental analysis in which we can assess the portfolio of stocks by considering the market conditions and company details. Hence Technical analysis can be easily achieved by machines which are capable of processing large chunks of data in no time.
In the next blog I will be explaining how I trained a Random Forest to predict the stock market and achieve better portfolio returns in less time.
##
