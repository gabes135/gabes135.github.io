import requests, io
import pandas as pd
import datetime

# # Set the pitcher ID and date range
# pitcher_id = 669373  # Example: Gerrit Cole
# start_date = "2025-07-29"
# end_date = "2025-08-03"

today = datetime.datetime.now()
yesterday  = today - datetime.timedelta(days = 1)

start_date = yesterday.strftime("%Y-%m-%d")#"2025-07-29"
end_date = yesterday.strftime("%Y-%m-%d")##"2025-08-03"

# Fetch data

# url = f'https://baseballsavant.mlb.com/statcast_search/csv?all=true&hfPT=&hfAB=&hfBBT=&hfPR=&hfZ=&stadium=&hfBBL=&hfNewZones=&hfGT=R%7CPO%7CS%7C=&hfSea=&hfSit=&player_type=pitcher&hfOuts=&opponent=&pitcher_throws=&batter_stands=&hfSA=&game_date_gt={start_date}&game_date_lt={end_date}&pitchers_lookup%5B%5D={pitcher_id}&team=&position=&hfRO=&home_road=&hfFlag=&metric_1=&hfInn=&min_pitches=0&min_results=0&group_by=name&sort_col=pitches&player_event_sort=h_launch_speed&sort_order=desc&min_abs=0&type=details&'
url = f'https://baseballsavant.mlb.com/statcast_search/csv?all=true&hfPT=&hfAB=&hfBBT=&hfPR=&hfZ=&stadium=&hfBBL=&hfNewZones=&hfGT=R%7CPO%7CS%7C=&hfSea=&hfSit=&player_type=pitcher&hfOuts=&opponent=&pitcher_throws=&batter_stands=&hfSA=&game_date_gt={start_date}&game_date_lt={end_date}&team=&position=&hfRO=&home_road=&hfFlag=&metric_1=&hfInn=&min_pitches=0&min_results=0&group_by=&sort_col=pitches&player_event_sort=api_p_release_speed&sort_order=desc&min_abs=0&type=details'
data = requests.get(url)
df = pd.read_csv(io.StringIO(data.text))

df = df[df.description.isin(['swinging_strike', 'called_strike', 'swinging_strike_blocked'])]
df = df.sort_values(by = 'pfx_z', ascending = False)

if df.shape[0] > 0:	
	df.to_csv("assets/savant_data/data_z.csv", index=False)
	print("Exported data_z.csv with", len(df), "rows")
else:
	print("No data_z.csv to export.")

df = df.sort_values(by = 'pfx_x', ascending = False)

if df.shape[0] > 0:	
	df.to_csv("assets/savant_data/data_x.csv", index=False)
	print("Exported data_x.csv with", len(df), "rows")
else:
	print("No data_x.csv to export.")