// export const roundDebuffConfig = [
//     // Round: 1
//     { round: 1, passive: 1, active: 0 },

//     // Round: 2
//     { round: 2, passive: 1, active: 0 },

//     // Round: 3 (Boss 1)
//     { round: 3, passive: 1, active: 1 },

//     // Round: 4
//     { round: 4, passive: 2, active: 0 },

//     // Round: 5
//     { round: 5, passive: 2, active: 0 },

//     // Round: 6 (Boss 2)
//     { round: 6, passive: 2, active: 1 },

//     // Round: 7
//     { round: 7, passive: 3, active: 0 },

//     // Round: 8
//     { round: 8, passive: 3, active: 0 },

//     // Round: 9 (Boss 3)
//     { round: 9, passive: 3, active: 1 },

//     // Round: 10 (Final Boss)
//     { round: 10, passive: 4, active: 2 },
// ];

export const debuffMilestones = {
    passiveRounds: [4, 7, 10],     // Add 1 new passive at each of these rounds (cumulative)
    activeRounds: {
      3: 1,                       
      6: 1,                        
      9: 1,                        
      10: 2                        
    }
  };
