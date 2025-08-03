# download_csv.py
import requests, io
import pandas as pd

# Set the pitcher ID and date range
pitcher_id = 669373  # Example: Gerrit Cole
start_date = "2025-07-29"
end_date = "2025-08-03"

# Fetch data

url = f'https://baseballsavant.mlb.com/statcast_search/csv?all=true&hfPT=&hfAB=&hfBBT=&hfPR=&hfZ=&stadium=&hfBBL=&hfNewZones=&hfGT=R%7CPO%7CS%7C=&hfSea=&hfSit=&player_type=pitcher&hfOuts=&opponent=&pitcher_throws=&batter_stands=&hfSA=&game_date_gt={start_date}&game_date_lt={end_date}&pitchers_lookup%5B%5D={pid}&team=&position=&hfRO=&home_road=&hfFlag=&metric_1=&hfInn=&min_pitches=0&min_results=0&group_by=name&sort_col=pitches&player_event_sort=h_launch_speed&sort_order=desc&min_abs=0&type=details&'

data = requests.get(url)
df = pd.read_csv(io.StringIO(data.text))

# Save to CSV
df.to_csv("assets/savant_data/data.csv", index=False)
print("Saved data.csv with", len(df), "rows")
