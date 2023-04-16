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
filename = "CPU_8_stress"
df = pd.read_csv(filename + ".csv")

ax = seaborn.lineplot(data=df, x="Time", y="A", label='Node 1', color='blue')

# ax.get_xaxis().set_major_formatter(date_fmt)
ax.set_xticks([df["Time"][0]])
tick_1 = "t" + get_sub(str(0))


ax.set_xticklabels([tick_1])

seaborn.lineplot(data=df, x="Time", y="B", label='Node 2', color='green')
seaborn.lineplot(data=df, x="Time", y="C", label='Node 3', color='orange')
seaborn.lineplot(data=df, x="Time", y="D",
                 label='Node 4 (Leader)', color="red")

plt.legend(loc='upper left')
plt.ylabel('CPU Usage (%)')
plt.ylim((-5, 105))
plt.axvline(x=df["Time"][0], color='g', linestyle=':')
plt.savefig(filename + ".pdf")
