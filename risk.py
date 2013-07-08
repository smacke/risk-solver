#!/usr/bin/env python

# Copyright (c) 2012, Stephen Macke
# All rights reserved.
# 
# Redistribution and use in source and binary forms, with or without
# modification, are permitted provided that the following conditions are met: 
# 
# 1. Redistributions of source code must retain the above copyright notice, this
#    list of conditions and the following disclaimer. 
# 2. Redistributions in binary form must reproduce the above copyright notice,
#    this list of conditions and the following disclaimer in the documentation
#    and/or other materials provided with the distribution. 
# 
# THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
# ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
# WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
# DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT OWNER OR CONTRIBUTORS BE LIABLE FOR
# ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
# (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
# LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
# ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
# (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
# SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
# 
# The views and conclusions contained in the software and documentation are those
# of the authors and should not be interpreted as representing official policies, 
# either expressed or implied, of the FreeBSD Project.

twodice = [[0]*6 for i in xrange(6)]
threedice = [[0]*6 for i in xrange(6)]

# get number of ways to have two dice with particular values,
# as well as three dice where the highest 2 have particular values
for i in xrange(6):
    for j in xrange(6):
        twodice[min(i,j)][max(i,j)] += 1
        for k in xrange(6):
            ordered = sorted([i,j,k])
            threedice[ordered[1]][ordered[2]] += 1

total2dice = sum(sum(arr) for arr in twodice)
total3dice = sum(sum(arr) for arr in threedice)

flawless3v2 = 0 # probability of attacker rolling 3 dice against 2 and losing no pieces
flawless2v2 = 0 # probability of attacker rolling 2 dice against 2 and losing no pieces
for h in xrange(5):
    for i in xrange(h,5):
        # prob of defender rolling rolling h and i
        # we divide by attacker sample space now to avoid doing it repeatedly later
        temp3v2 = float(twodice[h][i])/(total2dice*total3dice)
        temp2v2 = float(twodice[h][i])/(total2dice*total2dice)
        for j in xrange(h+1,6):
            for k in xrange(i+1,6):
                # going through all ways attacker can defeat two armies
                # without losing anybody in the process.
                flawless3v2 += temp3v2*threedice[j][k]
                flawless2v2 += temp2v2*twodice[j][k]

flawed3v2 = 0 # probability of attacker rolling 3v2 and each losing 1 piece
flawed2v2 = 0 # probability of attacker rolling 2v2 and each losing 1 piece
for h in xrange(5):
    for i in xrange(h,6):
        # prob of defender rolling h and i
        # once again we factor out division of attacker sample space
        temp3v2 = float(twodice[h][i])/(total2dice*total3dice)
        temp2v2 = float(twodice[h][i])/(total2dice*total2dice)
        for j in xrange(h+1,6):
            for k in xrange(j,i+1):
                # attacker defeats low die but loses to high die
                flawed3v2 += temp3v2*threedice[j][k]
                flawed2v2 += temp2v2*twodice[j][k]
        if i==5: continue # attacker cannot beat high die
        for j in xrange(h+1):
            for k in xrange(i+1,6):
                # attacker defeats high die but loses to low die
                flawed3v2 += temp3v2*threedice[j][k]
                flawed2v2 += temp2v2*twodice[j][k]

fatal3v2 = 1-flawless3v2-flawed3v2 # attacker loses two when rolling 3
fatal2v2 = 1-flawless2v2-flawed2v2 # attacker loses two when rolling 2

flawless1v2 = 0 # probability of attacker rolling 1 die and winning against 2 dice
for i in xrange(5):
    for j in xrange(i,5):
        # prob of defender rolling i and j
        # factor out division by six (attacker sample space)
        temp1v2 = float(twodice[i][j])/(total2dice*6)
        for k in xrange(j+1,6):
            flawless1v2 += temp1v2

fatal1v2 = 1-flawless1v2 # probability of attacker rolling 1v2 and losing

flawless3v1 = 0 # probability of attacker rolling 3v1 and winning
flawless2v1 = 0 # probability of attacker rolling 2v1 and winning
for i in xrange(5):
    temp3v1 = 1.0/(6*total3dice)
    temp2v1 = 1.0/(6*total2dice)
    for j in xrange(6):
        for k in xrange(max(j,i+1),6):
            flawless3v1 += temp3v1*threedice[j][k]
            flawless2v1 += temp2v1*twodice[j][k]

fatal3v1 = 1-flawless3v1 # probability of attacker rolling 3v1 and losing
fatal2v1 = 1-flawless2v1 # probabiliyy of attacker rolling 2v1 and losing


flawless1v1 = 0 # prob of attacker rolling 1v1 and winning
for i in xrange(5):
    for j in xrange(i+1,6):
        flawless1v1 += 1.0/36

fatal1v1 = 1-flawless1v1

# probs[x][y][z] means probability of attacker using x dice vs y dice with outcome z
# (z=0 is a win, z=1 is a tie, z=2 is a loss)
probs = [0, [0, [flawless1v1,0.0,fatal1v1], [flawless1v2,0.0,fatal1v2]],
            [0, [flawless2v1,0.0,fatal2v1], [flawless2v2,flawed2v2,fatal2v2]],
            [0, [flawless3v1,0.0,fatal3v1], [flawless3v2,flawed3v2,fatal3v2]]]
bmem = {}
omem = {}
tmem = {}

# Finds probability that army of size attackers will
# defeat army of size defenders with at least minleft troops left.
# Less general than outcomeprob.
def battleprob(attackers, defenders, minleft=1):
    if attackers < minleft: return 0.0
    if defenders == 0: return 1.0

    h = (attackers, defenders, minleft)
    if h in bmem: return bmem[h]

    val = 0.0
    if attackers >= 3 and defenders >= 2:
        val = probs[3][2][0]*battleprob(attackers, defenders-2, minleft) + \
              probs[3][2][1]*battleprob(attackers-1, defenders-1, minleft) + \
              probs[3][2][2]*battleprob(attackers-2, defenders, minleft)
    elif attackers >= 3 and defenders == 1:
        val = probs[3][1][0] + \
              probs[3][1][2]*battleprob(attackers-1, defenders, minleft)
    elif attackers == 2 and defenders >= 2:
        val = probs[2][2][0]*battleprob(attackers, defenders-2, minleft) + \
              probs[2][2][1]*battleprob(attackers-1, defenders-1, minleft) + \
              probs[2][2][2]*battleprob(attackers-2, defenders, minleft)
    elif attackers == 2 and defenders == 1:
        val = probs[2][1][0] + \
              probs[2][1][2]*battleprob(attackers-1, defenders, minleft)
    elif attackers == 1 and defenders >= 2:
        val = probs[1][2][0]*battleprob(attackers, defenders-1, minleft)
    elif attackers == 1 and defenders == 1:
        val = probs[1][1][0]

    bmem[h] = val
    return val

# Finds probability that an army of size attackers
# battling an army of size defenders will result in
# arem attackers and drem attackers remaining on either side.
def outcomeprob(attackers, defenders, arem=1, drem=0):
    if attackers < arem or defenders < drem: return 0.0
    if defenders == drem:
        if drem == 0 and attackers != arem: return 0.0
        if attackers == arem: return 1.0

    h = (attackers, defenders, arem, drem)
    if h in omem: return omem[h]

    val = 0.0
    if attackers >= 3 and defenders >= 2:
        val = probs[3][2][0]*outcomeprob(attackers, defenders-2, arem, drem) + \
              probs[3][2][1]*outcomeprob(attackers-1, defenders-1, arem, drem) + \
              probs[3][2][2]*outcomeprob(attackers-2, defenders, arem, drem)
    elif attackers >= 3 and defenders == 1:
        val = probs[3][1][0]*outcomeprob(attackers, defenders-1, arem, drem) + \
              probs[3][1][2]*outcomeprob(attackers-1, defenders, arem, drem)
    elif attackers == 2 and defenders >= 2:
        val = probs[2][2][0]*outcomeprob(attackers, defenders-2, arem, drem) + \
              probs[2][2][1]*outcomeprob(attackers-1, defenders-1, arem, drem) + \
              probs[2][2][2]*outcomeprob(attackers-2, defenders, arem, drem)
    elif attackers == 2 and defenders == 1:
        val = probs[2][1][0]*outcomeprob(attackers, defenders-1, arem, drem) + \
              probs[2][1][2]*outcomeprob(attackers-1, defenders, arem, drem)
    elif attackers == 1 and defenders >= 2:
        val = probs[1][2][0]*outcomeprob(attackers, defenders-1, arem, drem)
    elif attackers == 1 and defenders == 1:
        val = probs[1][1][0]*outcomeprob(attackers, defenders-1, arem, drem)

    omem[h] = val
    return val

# Finds probability of successful tour given:
# a starting army of size attackers,
# an array of armies darmies representing the defending armies in the order they will be attacked,
# which defending army is being attacked (default 0 for the start),
# the number of troops we want to leave behind at each country (default 1 for each country),
# number of guys we want to leave behind in each country
def tourprob(attackers, darmies, tindex=0, fortify=([1]*100)):
    if tindex == len(darmies): return 1.0
    if tindex == 0: # reset memoize table
        global tmem
        tmem = {}

    h = (attackers, tindex)
    if h in tmem: return tmem[h]

    army = attackers-fortify[tindex]
    minremaining = sum(fortify[i] for i in xrange(tindex+1,len(darmies)+1))

    val = 0.0
    for i in xrange(minremaining, army+1):
        val += outcomeprob(army, darmies[tindex], i)*tourprob(i, darmies, tindex+1, fortify)

    tmem[h] = val
    return val
