/* Copyright (c) 2013, Stephen Macke
 * All rights reserved.
 * 
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are met: 
 * 
 * 1. Redistributions of source code must retain the above copyright notice, this
 *    list of conditions and the following disclaimer. 
 * 2. Redistributions in binary form must reproduce the above copyright notice,
 *    this list of conditions and the following disclaimer in the documentation
 *    and/or other materials provided with the distribution. 
 * 
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
 * ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
 * WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
 * DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT OWNER OR CONTRIBUTORS BE LIABLE FOR
 * ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
 * (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
 * LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
 * ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
 * SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 * 
 * The views and conclusions contained in the software and documentation are those
 * of the authors and should not be interpreted as representing official policies, 
 * either expressed or implied, of the FreeBSD Project.
 */

var sum = function(arr) {
	var s=0;
	for (var i=0; i<arr.length; i++) {
		s += arr[i];
	}
	return s;
}

var zeros = function() {
	if (arguments.length == 1) {
		return _.range(arguments[0]).map(function(){return 0;});
	} else {
		var slice = Array.prototype.slice;
		args = slice.apply(arguments);
		var ret = []
		var first = args.shift();
		for (var i=first-1; i>=0; i--) {
			ret[i] = zeros.apply(null, args);
		}
		return ret;
	}
}

var memoize = function(f) {
	var mem = {};
	var slice = Array.prototype.slice;
	var memofunc = function() {
		var args = slice.apply(arguments);
		var hash = args.join(',');
		var ans = mem[hash];
		if (ans) {
			return ans;
		} else {
			ans = f.apply(null, [memofunc].concat(args));
			mem[hash] = ans;
			return ans;
		}
	}
	return memofunc;
}

twodice = zeros(6,6);
threedice = zeros(6,6);

// get number of ways to have two dice with particular values,
// as well as three dice where the highest 2 have particular values
for (var i=0; i<6; i++) {
	for (var j=0; j<6; j++) {
		twodice[_.min([i,j])][_.max([i,j])]++;
		for (var k=0; k<6; k++) {
			ordered = [i,j,k].sort();
			threedice[ordered[1]][ordered[2]]++;
		}
	}
}

var total2dice = 0;
for (var i=0; i<twodice.length; i++) {
	total2dice += sum(twodice[i]);
}

var total3dice = 0;
for (var i=0; i<twodice.length; i++) {
	total3dice += sum(threedice[i]);
}

var flawless3v2 = 0; // probability of attacker rolling 3 dice against 2 and losing no pieces
var flawless2v2 = 0; // probability of attacker rolling 2 dice against 2 and losing no pieces
for (var h=0; h<5; h++) {
    for (var i=h; i<5; i++) {
        // prob of defender rolling rolling h and i
        // we divide by attacker sample space now to avoid doing it repeatedly later
        var temp3v2 = twodice[h][i]/(total2dice*total3dice);
        var temp2v2 = twodice[h][i]/(total2dice*total2dice);
        for (var j=h+1; j<6; j++) {
            for (var k=i+1; k<6; k++) {
                // going through all ways attacker can defeat two armies
                // without losing anybody in the process.
                flawless3v2 += temp3v2*threedice[j][k];
                flawless2v2 += temp2v2*twodice[j][k];
            }
        }
    }
}

var flawed3v2 = 0; // probability of attacker rolling 3v2 and each losing 1 piece
var flawed2v2 = 0; // probability of attacker rolling 2v2 and each losing 1 piece
for (var h=0; h<5; h++) {
    for (var i=h; i<6; i++) {
        // prob of defender rolling h and i
        // once again we factor out division of attacker sample space
        var temp3v2 = twodice[h][i]/(total2dice*total3dice);
        var temp2v2 = twodice[h][i]/(total2dice*total2dice);
        for (var j=h+1; j<6; j++) {
            for (var k=j; k<=i; k++) {
                // attacker defeats low die but loses to high die
                flawed3v2 += temp3v2*threedice[j][k];
                flawed2v2 += temp2v2*twodice[j][k];
            }
        }
        if (i===5) continue; // attacker cannot beat high die
        for (var j=0; j<=h; j++) {
            for (var k=i+1; k<6; k++) {
                // attacker defeats high die but loses to low die
                flawed3v2 += temp3v2*threedice[j][k];
                flawed2v2 += temp2v2*twodice[j][k];
            }
        }
    }
}

var fatal3v2 = 1-flawless3v2-flawed3v2; // attacker loses two when rolling 3
var fatal2v2 = 1-flawless2v2-flawed2v2; // attacker loses two when rolling 2

var flawless1v2 = 0; // probability of attacker rolling 1 die and winning against 2 dice
for (var i=0; i<5; i++) {
    for (var j=i; j<5; j++) {
        // prob of defender rolling i and j
        // factor out division by six (attacker sample space)
        var temp1v2 = twodice[i][j]/(total2dice*6);
        for (var k=j+1; k<6; k++) {
            flawless1v2 += temp1v2;
        }
    }
}

var fatal1v2 = 1-flawless1v2; // probability of attacker rolling 1v2 and losing

var flawless3v1 = 0; // probability of attacker rolling 3v1 and winning
var flawless2v1 = 0; // probability of attacker rolling 2v1 and winning
for (var i=0; i<5; i++) {
    var temp3v1 = 1/(6*total3dice);
    var temp2v1 = 1/(6*total2dice);
    for (var j=0; j<6; j++) {
        for (var k=_.max([j,i+1]); k<6; k++) {
            flawless3v1 += temp3v1*threedice[j][k];
            flawless2v1 += temp2v1*twodice[j][k];
        }
    }
}

fatal3v1 = 1-flawless3v1; // probability of attacker rolling 3v1 and losing
fatal2v1 = 1-flawless2v1; // probabiliyy of attacker rolling 2v1 and losing


var flawless1v1 = 0; // prob of attacker rolling 1v1 and winning
for (var i=0; i<5; i++) {
    for (var j=i+1; j<6; j++) {
        flawless1v1 += 1/36;
    }
}

var fatal1v1 = 1-flawless1v1;

// probs[x][y][z] means probability of attacker using x dice vs y dice with outcome z
// (z=0 is a win, z=1 is a tie, z=2 is a loss)
probs = [0, [0, [flawless1v1,0,fatal1v1], [flawless1v2,0,fatal1v2]],
            [0, [flawless2v1,0,fatal2v1], [flawless2v2,flawed2v2,fatal2v2]],
            [0, [flawless3v1,0,fatal3v1], [flawless3v2,flawed3v2,fatal3v2]]];

// Finds probability that army of size attackers will
// defeat army of size defenders with at least minleft troops left.
// Less general than outcomeprob.
var battleprob = memoize(function(memofunc, attackers, defenders, minleft) {
	minleft = minleft || 1;
    if (attackers < minleft) return 0;
    if (defenders === 0) return 1;

    if (attackers >= 3 && defenders >= 2) {
        return probs[3][2][0]*memofunc(attackers, defenders-2, minleft) +
               probs[3][2][1]*memofunc(attackers-1, defenders-1, minleft) +
               probs[3][2][2]*memofunc(attackers-2, defenders, minleft);
    } else if (attackers >= 3 && defenders === 1) {
        return probs[3][1][0] +
               probs[3][1][2]*memofunc(attackers-1, defenders, minleft);
    } else if (attackers === 2 && defenders >= 2) {
        return probs[2][2][0]*memofunc(attackers, defenders-2, minleft) +
               probs[2][2][1]*memofunc(attackers-1, defenders-1, minleft) +
               probs[2][2][2]*memofunc(attackers-2, defenders, minleft);
    } else if (attackers === 2 && defenders === 1) {
        return probs[2][1][0] +
               probs[2][1][2]*memofunc(attackers-1, defenders, minleft);
    } else if (attackers === 1 && defenders >= 2) {
        return probs[1][2][0]*memofunc(attackers, defenders-1, minleft);
    } else if (attackers === 1 && defenders === 1) {
        return probs[1][1][0];
    } else return NaN; //debugging
});

// Finds probability that an army of size attackers
// battling an army of size defenders will result in
// arem attackers and drem attackers remaining on either side.
var outcomeprob = memoize(function(memofunc, attackers, defenders, arem, drem) {
	arem = arem || 1;
	drem = drem || 0;
    if (attackers < arem || defenders < drem) return 0;
    if (defenders === drem) {
        if (drem === 0 && attackers !== arem) return 0;
        if (attackers === arem) return 1;
    }

    if (attackers >= 3 && defenders >= 2) {
        return probs[3][2][0]*memofunc(attackers, defenders-2, arem, drem) +
               probs[3][2][1]*memofunc(attackers-1, defenders-1, arem, drem) +
               probs[3][2][2]*memofunc(attackers-2, defenders, arem, drem);
    } else if (attackers >= 3 && defenders === 1) {
        return probs[3][1][0]*memofunc(attackers, defenders-1, arem, drem) +
               probs[3][1][2]*memofunc(attackers-1, defenders, arem, drem);
    } else if (attackers === 2 && defenders >= 2) {
        return probs[2][2][0]*memofunc(attackers, defenders-2, arem, drem) +
               probs[2][2][1]*memofunc(attackers-1, defenders-1, arem, drem) +
               probs[2][2][2]*memofunc(attackers-2, defenders, arem, drem);
    } else if (attackers === 2 && defenders === 1) {
        return probs[2][1][0]*memofunc(attackers, defenders-1, arem, drem) +
               probs[2][1][2]*memofunc(attackers-1, defenders, arem, drem);
    } else if (attackers === 1 && defenders >= 2) {
        return probs[1][2][0]*memofunc(attackers, defenders-1, arem, drem);
    } else if (attackers === 1 && defenders === 1) {
        return probs[1][1][0]*memofunc(attackers, defenders-1, arem, drem);
    } else return NaN; //debugging
});

var tourprob = function() {
	return function(tour) {
		var attackers = tour.attackers;
		var darmies = tour.defending_armies;
		var fortify = tour.fortifying_armies || zeros(100).map(function(){return 1;});

		// Finds probability of successful tour given:
		// a starting army of size attackers,
		// an array of armies darmies representing the defending armies in the order they will be attacked,
		// which defending army is being attacked (default 0 for the start),
		// the number of troops we want to leave behind at each country (default 1 for each country),
		// number of guys we want to leave behind in each country
		var tourprob_impl = memoize(function(memofunc, tindex, attackers) {
		    if (tindex === darmies.length) return 1;

		    // assume we attack with everyone
		    // we're not leaving behind
		    var army = attackers - fortify[tindex];
		    var minremaining = 0;
		    for (var i=tindex+1; i<=darmies.length; i++) {
		    	minremaining += fortify[i];
		    }

		    var ret = 0;
		    for (var remaining=minremaining; remaining<=army; remaining++) {
		        ret += outcomeprob(army, darmies[tindex], remaining) *
		        	   memofunc(tindex+1, remaining);
		    }
		    return ret;
		});

		return tourprob_impl(0, attackers);
	}
}();