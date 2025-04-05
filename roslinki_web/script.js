// ======================
// KONFIGURACJA I STANY
// ======================
const GameState = {
    coins: 1000000,
    time: 0,
    timeInterval: null,
    unlockedBeds: 1,
    plantPrices: {
      corn: 550,
      tomato: 1100,
      rose: 4200
    },
    actionCosts: {
      water: 5,
      fertilize: 100,
      rescue: 50,
      cut: 0
    },
    harvestRewards: {
      corn: 100,
      tomato: 200,
      rose: 300
    }
  };
  
  const PLANTS_CONFIG = {
    corn: {
      name: "Kukurydza",
      stages: [
        "images/corn/corn_sampling.png",
        "images/corn/corn_growth_1.png",
        "images/corn/corn_growth_2.png",
        "images/corn/corn_growth_3.png", 
        "images/corn/corn_growth_4.png",
        "images/corn/corn_growth_5.png",
        "images/corn/corn_dead.png"
      ],
      maxWater: 5,
      maxStage: 5
    },
    tomato: {
      name: "Pomidor",
      stages: [
        "images/tomato/tomato_sampling.png",
        "images/tomato/tomato_growth_1.png",
        "images/tomato/tomato_growth_2.png",
        "images/tomato/tomato_growth_3.png",
        "images/tomato/tomato_growth_4.png",
        "images/tomato/tomato_growth_5.png",
        "images/tomato/tomato_dead.png"
      ],
      maxWater: 4,
      maxStage: 5
    },
    rose: {
      name: "Róża",
      stages: [
        "images/rose/rose_sampling.png",
        "images/rose/rose_growth_1.png",
        "images/rose/rose_growth_2.png",
        "images/rose/rose_growth_3.png",
        "images/rose/rose_growth_4.png",
        "images/rose/rose_growth_5.png",
        "images/rose/rose_dead.png"
      ],
      maxWater: 3,
      maxStage: 5
    }
  };
  
  const GARDEN_BEDS = {
    bed1: Array(5).fill(null),
    bed2: Array(5).fill(null),
    bed3: Array(5).fill(null)
  };
  
  const AppState = {
    selectedPlant: null,
    modes: {
      watering: false,
      fertilizing: false,
      rescuing: false,
      cutting: false
    }
  };
  
  // ======================
  // UTILS
  // ======================
  const getPlantData = (type) => PLANTS_CONFIG[type] || null;
  
  const updateCoinsUI = () => {
    const coinsElement = document.getElementById('coins');
    if (coinsElement) {
      coinsElement.textContent = GameState.coins;
    }
    document.querySelectorAll('.plant-option').forEach(option => {
        const plantType = option.querySelector('img').dataset.plant;
        const price = GameState.plantPrices[plantType];
        option.classList.toggle('disabled', GameState.coins < price);
    });
  };
  
  const canAfford = (cost) => {
    if (GameState.coins >= cost) return true;
    alert(`Nie stać cię! Potrzebujesz ${cost} monet.`);
    return false;
  };

  const resetModes = () => {
    Object.keys(AppState.modes).forEach(key => {
      AppState.modes[key] = false;
    });
    document.querySelectorAll('.action-bar button').forEach(btn => {
      btn.classList.remove('active');
    });
  };

  const startGameTimer = () => {
    GameState.timeInterval = setInterval(() => {
      GameState.time++;
      updateTimeUI();
      
      if (GameState.time % 5 === 0) {
        decreasePlantWater();
      }
    }, 1000);
  };
  
  const updateTimeUI = () => {
    const minutes = Math.floor(GameState.time / 60).toString().padStart(2, '0');
    const seconds = (GameState.time % 60).toString().padStart(2, '0');
    document.getElementById('time-display').textContent = `${minutes}:${seconds}`;
  };
  
  const decreasePlantWater = () => {
    Object.keys(GARDEN_BEDS).forEach(bedId => {
      GARDEN_BEDS[bedId].forEach((plant, index) => {
        if (plant?.isAlive && plant.water > 0) {
          plant.water -= 1;
          render.updatePlant(bedId, index);
        }
      });
    });
    render.showMessage("Poziom nawodnienia roślin spadł!");
  };
  
  // ======================
  // OPERACJE NA ROŚLINACH
  // ======================
  const plantOperations = {
    createNew: (type) => ({
      type,
      stage: 0,
      water: 0,
      isAlive: true
    }),
  
    water: (plant) => {
      if (!plant?.isAlive) return null;
      
      plant.water += 1;
      const plantData = getPlantData(plant.type);
  
      if (plant.water >= plantData.maxWater) {
        plant.isAlive = false;
        plant.stage = plantData.stages.length - 1;
        return { message: `Roślina ${plantData.name} została przelana i umarła!` };
      }
  
      if (plant.water % 2 === 0 && plant.stage < plantData.maxStage) {
        plant.stage += 1;
        return { message: `Roślina ${plantData.name} urosła do etapu ${plant.stage + 1}!` };
      }
      
      return null;
    },
  
    revive: (plant) => {
      if (!plant) return;
      plant.isAlive = true;
      plant.water = 0;
      plant.stage = 0;
    }
  };
  
  // ======================
  // OPERACJE NA GRZĄDKACH
  // ======================
  const gardenOperations = {
    initSlots: () => {
        const createSlot = (bedId, index) => {
          const slot = document.createElement('div');
          slot.className = 'plant-slot';
          slot.dataset.slot = `${bedId}-${index}`;
          document.getElementById(bedId).appendChild(slot);
          return slot;
        };
      
        return {
          bed1: Array.from({ length: 5 }, (_, i) => createSlot('bed1', i)),
          bed2: Array.from({ length: 5 }, (_, i) => createSlot('bed2', i)),
          bed3: Array.from({ length: 5 }, (_, i) => createSlot('bed3', i))
        };
    },

    initSlotsForBed: (bedId) => {
        const bed = document.getElementById(bedId);
        
        bed.querySelectorAll('.plant-slot').forEach(slot => slot.remove());
        
        for (let i = 0; i < 5; i++) {
          const slot = document.createElement('div');
          slot.className = 'plant-slot';
          slot.dataset.slot = `${bedId}-${i}`;
          bed.insertBefore(slot, bed.firstChild);
        }
        
        GARDEN_BEDS[bedId] = Array(5).fill(null);
    },
  
    findMaturePlants: (bedId) => 
      GARDEN_BEDS[bedId]
        .map((plant, index) => ({ plant, index }))
        .filter(item => item.plant?.isAlive && item.plant.stage === getPlantData(item.plant.type).maxStage),
  
    findDeadPlants: (bedId) =>
      GARDEN_BEDS[bedId]
        .map((plant, index) => ({ plant, index }))
        .filter(item => item.plant && !item.plant.isAlive),
  
    findEmptySlots: (bedId) =>
      GARDEN_BEDS[bedId]
        .map((plant, index) => plant === null ? index : -1)
        .filter(index => index !== -1),
  
    countAllPlants: () => 
      Object.values(GARDEN_BEDS).reduce((count, bed) => 
        count + bed.filter(Boolean).length, 0)
  };
  
  // ======================
  // RENDER
  // ======================
  const render = {
    updatePlant: (bedId, slotIndex) => {
        const allSlots = document.querySelectorAll(`#${bedId} .plant-slot`);
        if (slotIndex >= allSlots.length) {
          console.error(`Slot ${slotIndex} nie istnieje w ${bedId}!`);
          return;
        }
        
        const slot = allSlots[slotIndex];
        const plant = GARDEN_BEDS[bedId][slotIndex];
        
        slot.innerHTML = plant 
          ? `<img src="${getPlantData(plant.type).stages[plant.stage]}" 
               style="max-height:90%; ${!plant.isAlive ? 'filter:sepia(80%)' : ''}"
               alt="${getPlantData(plant.type).name}">` 
          : '';
    },
  
    highlightSelected: (selectedImg) => {
      document.querySelectorAll('.plant-options img').forEach(img => {
        img.classList.toggle('selected', img === selectedImg);
      });
    },
  
    showMessage: (message) => {
      const messagesElement = document.getElementById('messages');
      if (messagesElement) {
        messagesElement.textContent = message;
        setTimeout(() => messagesElement.textContent = '', 3000);
      }
    }
  };
  
  // ======================
  // HANDLERY AKCJI
  // ======================
  const actionHandlers = {
    handlePlantSelection: (img) => {
      // RESETUJEMY WSZYSTKIE AKCJE
      resetModes();
      
      const plantType = img.dataset.plant;
      const price = GameState.plantPrices[plantType];
      
      if (!canAfford(price)) {
        render.showMessage(`Nie stać cię na ${getPlantData(plantType).name} (${price} monet)`);
        return;
      }
      
      render.highlightSelected(img);
      AppState.selectedPlant = plantType;
      render.showMessage(`Wybrano: ${getPlantData(plantType).name}. Kliknij w wolny slot.`);
    },

    handleBedUnlock: (bedElement) => {
        const price = parseInt(bedElement.dataset.price);
        if (!canAfford(price)) {
          render.showMessage(`Nie stać cię! Potrzebujesz ${price} monet.`);
          return;
        }
      
        GameState.coins -= price;
        bedElement.classList.remove('locked');
        
        const bedId = bedElement.id;
        gardenOperations.initSlotsForBed(bedId);
        
        document.querySelectorAll(`#${bedId} .plant-slot`).forEach(slot => {
            slot.addEventListener('click', () => actionHandlers.handleSlotClick(slot));
        });

        updateCoinsUI();
        render.showMessage(`Odblokowano nowe pole ogrodowe!`);
    },
  
    handleSlotClick: (slot) => {
      const bedId = slot.parentElement.id;
      const allSlots = Array.from(slot.parentElement.querySelectorAll('.plant-slot'));
      const slotIndex = allSlots.indexOf(slot);

      console.log(`Kliknięto slot ${slotIndex} w ${bedId}`);

      if (AppState.modes.cutting) {
        actionHandlers.handleCutAction(slot);
        return;
      }
      
      if (Object.values(AppState.modes).some(Boolean)) return;
      
      if (AppState.selectedPlant) {
        actionHandlers.handlePlanting(slot);
      }
    },
  
    handlePlanting: (slot) => {
      if (!AppState.selectedPlant) {
        render.showMessage("Najpierw wybierz roślinę!");
        return;
      }
  
      const bedId = slot.parentElement.id;
      const slotIndex = Array.from(slot.parentElement.children).indexOf(slot);
      const price = GameState.plantPrices[AppState.selectedPlant];
  
      if (GARDEN_BEDS[bedId][slotIndex] !== null) {
        render.showMessage("Ten slot jest już zajęty!");
        return;
      }
  
      if (!canAfford(price)) return;
  
      GameState.coins -= price;
      updateCoinsUI();
      
      GARDEN_BEDS[bedId][slotIndex] = plantOperations.createNew(AppState.selectedPlant);
      render.updatePlant(bedId, slotIndex);
      
      AppState.selectedPlant = null;
      render.showMessage("Roślina zasadzona!");
    },
  
    handleBedAction: (bedId) => {
      if (document.getElementById(bedId).classList.contains('locked')) return;
      if (AppState.modes.watering) {
        actionHandlers.handleWatering(bedId);
      } else if (AppState.modes.fertilizing) {
        actionHandlers.handleFertilizing(bedId);
      } else if (AppState.modes.rescuing) {
        actionHandlers.handleRescuing(bedId);
      }
    },
  
    handleWatering: (bedId) => {
      if (!canAfford(GameState.actionCosts.water)) return;
      
      GameState.coins -= GameState.actionCosts.water;
      updateCoinsUI();
      
      let hasPlants = false;
      GARDEN_BEDS[bedId].forEach((plant, index) => {
        if (plant?.isAlive) {
          hasPlants = true;
          const result = plantOperations.water(plant);
          render.updatePlant(bedId, index);
          if (result?.message) render.showMessage(result.message);
        }
      });
  
      if (!hasPlants) {
        render.showMessage("W tej grządce nie ma żywych roślin do podlania!");
      }
    },
  
    handleFertilizing: (bedId) => {
      if (!canAfford(GameState.actionCosts.fertilize)) return;
      
      GameState.coins -= GameState.actionCosts.fertilize;
      updateCoinsUI();
      
      const maturePlants = gardenOperations.findMaturePlants(bedId);
      if (!maturePlants.length) {
        render.showMessage("Brak dojrzałych roślin w tej grządce!");
        return;
      }
  
      const emptySlots = gardenOperations.findEmptySlots(bedId);
      if (!emptySlots.length) {
        render.showMessage("Brak wolnych miejsc w tej grządce!");
        return;
      }
  
      const { plant } = maturePlants[Math.floor(Math.random() * maturePlants.length)];
      const targetSlot = emptySlots[0];
  
      GARDEN_BEDS[bedId][targetSlot] = plantOperations.createNew(plant.type);
      render.updatePlant(bedId, targetSlot);
      render.showMessage(`Nowa roślina ${getPlantData(plant.type).name} wyrosła!`);
    },
  
    handleRescuing: (bedId) => {
      if (!canAfford(GameState.actionCosts.rescue)) return;
      
      GameState.coins -= GameState.actionCosts.rescue;
      updateCoinsUI();
      
      const deadPlants = gardenOperations.findDeadPlants(bedId);
      if (!deadPlants.length) {
        render.showMessage("Brak martwych roślin w tej grządce!");
        return;
      }
  
      deadPlants.forEach(({ plant, index }) => {
        plantOperations.revive(plant);
        render.updatePlant(bedId, index);
      });
  
      render.showMessage(`Przywrócono do życia ${deadPlants.length} roślin!`);
    },
  
    handleCutAction: (slot) => {
      const bedId = slot.parentElement.id;
      const slotIndex = Array.from(slot.parentElement.children).indexOf(slot);
      const plant = GARDEN_BEDS[bedId][slotIndex];
  
      if (!plant) {
        render.showMessage("Nie ma rośliny w tym slocie!");
        return;
      }
  
      const totalPlants = gardenOperations.countAllPlants();
      const plantName = getPlantData(plant.type).name;
  
      if (totalPlants > 1) {
        GARDEN_BEDS[bedId][slotIndex] = null;
        render.showMessage(`Ścięto roślinę ${plantName}!`);
      } else {
        plantOperations.revive(plant);
        render.showMessage(`To była ostatnia roślina! Zaczynamy od nowa.`);
      }
  
      render.updatePlant(bedId, slotIndex);
    },
  
    handleHarvest: () => {
      let totalEarned = 0;
      
      Object.keys(GARDEN_BEDS).forEach(bedId => {
        GARDEN_BEDS[bedId].forEach((plant, index) => {
          if (plant?.isAlive && plant.stage === getPlantData(plant.type).maxStage) {
            totalEarned += GameState.harvestRewards[plant.type];
            plant.stage = 0;
            plant.water = 0;
            render.updatePlant(bedId, index);
          }
        });
      });
      
      if (totalEarned > 0) {
        GameState.coins += totalEarned;
        updateCoinsUI();
        render.showMessage(`Zebrano plony! +${totalEarned} monet!`);
      } else {
        render.showMessage("Brak dojrzałych roślin do zbioru!");
      }
    }
  };
  
  // ======================
  // INICJALIZACJA
  // ======================
  const initEventListeners = () => {
    // Wybór rośliny
    document.querySelectorAll('.plant-option img').forEach(img => {
        img.addEventListener('click', () => actionHandlers.handlePlantSelection(img));
    });
  
    // Kliknięcia w sloty
    document.querySelectorAll('.plant-slot').forEach(slot => {
      slot.addEventListener('click', () => actionHandlers.handleSlotClick(slot));
    });

    // Odblokowanie grządek
    document.querySelectorAll('.unlock-bed').forEach(button => {
        button.addEventListener('click', (e) => {
          e.stopPropagation(); // Zapobiega wyzwalaniu akcji na grządce
          actionHandlers.handleBedUnlock(e.target.closest('.garden-bed'));
        });
      });
  
    // Przyciski akcji
    const setupActionButton = (id, mode) => {
        document.getElementById(id).addEventListener('click', () => {
          resetModes();
          AppState.modes[mode] = true;
          document.getElementById(id).classList.add('active');
          render.showMessage(getActionMessage(mode));
        });
      };
  
    setupActionButton('water', 'watering');
    setupActionButton('fertilize', 'fertilizing');
    setupActionButton('rescue', 'rescuing');
    setupActionButton('cut', 'cutting');
  
    // Kliknięcia w grządki
    document.querySelectorAll('.garden-bed').forEach(bed => {
      bed.addEventListener('click', () => actionHandlers.handleBedAction(bed.id));
    });
  
    // Zbiór plonów
    document.getElementById('harvest').addEventListener('click', actionHandlers.handleHarvest);
  };
  
  const getActionMessage = (action) => {
    const messages = {
      watering: "Wybierz grządkę do podlania (kliknij na grządkę)",
      fertilizing: "Wybierz grządkę do nawożenia (kliknij na grządkę)",
      rescuing: "Wybierz grządkę z martwymi roślinami do ratowania",
      cutting: "Wybierz roślinę do ścięcia (kliknij na roślinę)"
    };
    return messages[action];
  };
  
  // ======================
  // START APLIKACJI
  // ======================
  const initGarden = () => {
    if (GameState.timeInterval) {
        clearInterval(GameState.timeInterval);
    }
    document.querySelectorAll('.plant-slot').forEach(slot => slot.remove());
    gardenOperations.initSlots();
    
    initEventListeners();
    updateCoinsUI();
    startGameTimer();
  };
  
  window.onload = initGarden;