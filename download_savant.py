# download_csv.py
from pybaseball import statcast_pitcher
import pandas as pd

# Set the pitcher ID and date range
pitcher_id = 669373  # Example: Gerrit Cole
start_date = "2025-07-29"
end_date = "2025-08-03"

# Fetch data
df = statcast_pitcher(start_date, end_date, pitcher_id)

# Save to CSV
df.to_csv("assets/savant_data/data.csv", index=False)
print("Saved data.csv with", len(df), "rows")
