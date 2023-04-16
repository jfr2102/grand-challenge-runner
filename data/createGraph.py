import pandas as pd
import matplotlib.pyplot as plt
import matplotlib.dates as mdates
import seaborn
import matplotlib.ticker as mtick
from datetime import timedelta


def get_sub(x):
    normal = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+-=()"
    sub_s = "ₐ₈CDₑբGₕᵢⱼₖₗₘₙₒₚQᵣₛₜᵤᵥwₓᵧZₐ♭꜀ᑯₑբ₉ₕᵢⱼₖₗₘₙₒₚ૧ᵣₛₜᵤᵥwₓᵧ₂₀₁₂₃₄₅₆₇₈₉₊₋₌₍₎"
    res = x.maketrans(''.join(normal), ''.join(sub_s))
    return x.translate(res)


date_fmt = mdates.DateFormatter('%H:%M:%S')
seaborn.set()
df = pd.read_csv(
    "1_submission/CPU-data-as-joinbyfield-2023-04-16 02 03 49_single_submission.csv")

# plt.plot(df["Time"], df["A"], label='Node 1', color='blue')
# plt.plot(df["Time"], df["B"], label='Node 2', color='green')
# plt.plot(df["Time"], df["C"], label='Node 3', color='orange')
# plt.plot(df["Time"], df["D"], label='Node 4 (Leader)', color="red")

ax = seaborn.lineplot(data=df, x="Time", y="A", label='Node 1', color='blue')

ax.get_xaxis().set_major_formatter(date_fmt)
ax.set_xticks([df["Time"][0], df["Time"][100]])

tick_1 = "t" + get_sub(str(0))
tick_2 = "t" + get_sub(str(1)) + " (+ 500 seconds)"
ax.set_xticklabels([tick_1, tick_2])
seaborn.lineplot(data=df, x="Time", y="B", label='Node 2', color='green')
seaborn.lineplot(data=df, x="Time", y="C", label='Node 3', color='orange')
seaborn.lineplot(data=df, x="Time", y="D",
                 label='Node 4 (Leader)', color="red")
print(df)
# detect tick locations automatically
pos = mdates.AutoDateLocator()
#  ormat the datetime with '%Y-%m-%d

plt.legend(loc='upper left')
plt.ylabel('CPU Usage (%)')
# plt.gca().xaxis.set(major_locator=pos)
# plt.axvline(x=df["Time"][0], color='g', linestyle='-')
# plt.axvline(x=df["Time"][50], color='r', linestyle=':')
# plt.axvline(x=df["Time"][100], color="r", linestyle="-")
# keep only every second tick
# df.plot(x='Time', y="D")
plt.savefig("test.pdf")
