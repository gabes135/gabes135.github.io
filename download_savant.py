import requests, io
import pandas as pd
import datetime
import os

# # Set the pitcher ID and date range
# pitcher_id = 669373  # Example: Gerrit Cole
# start_date = "2025-07-29"
# end_date = "2025-08-03"

df_eta = pd.read_csv('assets/savant_data/eta.csv')

today = datetime.datetime.now()
yesterday  = today - datetime.timedelta(days = 1)
yesteryesterday  = today - datetime.timedelta(days = 2)

start_date = yesterday.strftime("%Y-%m-%d")#"2025-07-29"
end_date = yesterday.strftime("%Y-%m-%d")##"2025-08-03"



to_del = [d for d in os.listdir('assets/savant_data/') if '-' in d]

if len(to_del)>0:
	to_del=to_del[0]
	folder_old = folder = f'assets/savant_data/{to_del}'
	
	print(f'Removing old files from {folder_old}.')

	os.remove(folder_old+"/data_z_neg.csv")
	os.remove(folder_old+"/data_z_pos.csv")
	os.remove(folder_old+"/data_x_arm.csv")
	os.remove(folder_old+"/data_x_glove.csv")
os.rmdir(folder_old)
	

folder = f'assets/savant_data/{start_date}'
os.makedirs(folder, exist_ok=True)


print(f'Adding new files to {folder}.')
# url = f'https://baseballsavant.mlb.com/statcast_search/csv?all=true&hfPT=&hfAB=&hfBBT=&hfPR=&hfZ=&stadium=&hfBBL=&hfNewZones=&hfGT=R%7CPO%7CS%7C=&hfSea=&hfSit=&player_type=pitcher&hfOuts=&opponent=&pitcher_throws=&batter_stands=&hfSA=&game_date_gt={start_date}&game_date_lt={end_date}&pitchers_lookup%5B%5D={pitcher_id}&team=&position=&hfRO=&home_road=&hfFlag=&metric_1=&hfInn=&min_pitches=0&min_results=0&group_by=name&sort_col=pitches&player_event_sort=h_launch_speed&sort_order=desc&min_abs=0&type=details&'
url = f'https://baseballsavant.mlb.com/statcast_search/csv?all=true&hfPT=&hfAB=&hfBBT=&hfPR=&hfZ=&stadium=&hfBBL=&hfNewZones=&hfGT=R%7CPO%7CS%7C=&hfSea=&hfSit=&player_type=pitcher&hfOuts=&opponent=&pitcher_throws=&batter_stands=&hfSA=&game_date_gt={start_date}&game_date_lt={end_date}&team=&position=&hfRO=&home_road=&hfFlag=&metric_1=&hfInn=&min_pitches=0&min_results=0&group_by=&sort_col=pitches&player_event_sort=api_p_release_speed&sort_order=desc&min_abs=0&type=details'
data = requests.get(url)
df = pd.read_csv(io.StringIO(data.text))

df = pd.merge(df, df_eta, left_on = 'pitcher', right_on = 'entity_id')

df = df[df.description.isin(['swinging_strike', 'called_strike', 'swinging_strike_blocked'])]
df = df[~df.spin_axis.isna()]

if df.shape[0] == 0:	
	print("No data to export.")
	exit()


df = df.sort_values(by = 'pfx_z', ascending = False)
df.to_csv(f"{folder}/data_z_pos.csv", index=False)
print("Exported data_z_pos.csv with", len(df), "rows")

df_drop = df.copy()
df_drop['pfx_z'] *= -1
df_drop = df_drop.sort_values(by = 'pfx_z', ascending = False)
df_drop.to_csv(f"{folder}/data_z_neg.csv", index=False)
print("Exported data_z_neg.csv with", len(df_drop), "rows")

df_R = df[df['p_throws'] == 'R']
df_L = df[df['p_throws'] == 'L'].copy()
df_L['pfx_x'] *= -1

df_glove = pd.concat([df_R, df_L])
df_glove = df_glove.sort_values(by = 'pfx_x', ascending = False)

df_glove.to_csv(f"{folder}/data_x_glove.csv", index=False)
print("Exported data_x_glove.csv with", len(df_glove), "rows")


df_arm = df_glove.sort_values(by = 'pfx_x', ascending = True)
df_arm['pfx_x'] *= -1
df_arm.to_csv(f"{folder}/data_x_arm.csv", index=False)
print("Exported data_x_glove.csv with", len(df_arm), "rows")
