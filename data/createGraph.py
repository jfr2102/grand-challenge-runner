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
    "CPU_32_submission.csv")

ax = seaborn.lineplot(data=df, x="Time", y="A", label='Node 1', color='blue')

# ax.get_xaxis().set_major_formatter(date_fmt)
ax.set_xticks([df["Time"][0], df["Time"][45], df["Time"][63]])
tick_1 = "t" + get_sub(str(0))
tick_2 = "t" + get_sub(str(1))
tick_3 = "t" + get_sub(str(2)) + ":= " + tick_1 + " + 315 sec"
ax.set_xticklabels([tick_1, tick_2, tick_3])

seaborn.lineplot(data=df, x="Time", y="B", label='Node 2', color='green')
seaborn.lineplot(data=df, x="Time", y="C", label='Node 3', color='orange')
seaborn.lineplot(data=df, x="Time", y="D",
                 label='Node 4 (Leader)', color="red")

plt.legend(loc='upper left')
plt.ylabel('CPU Usage (%)')
plt.ylim((-5, 100))
plt.axvline(x=df["Time"][0], color='g', linestyle=':')
plt.axvline(x=df["Time"][45], color='r', linestyle=':')
plt.axvline(x=df["Time"][63], color='r', linestyle=':')
# plt.axvline(x=df["Time"][100], color="r", linestyle="-")
# keep only every second tick
# df.plot(x='Time', y="D")
plt.savefig("test.pdf")
