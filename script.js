document.addEventListener('DOMContentLoaded', function () {
    const searchInput = document.getElementById('pokemon-search');
    searchInput.addEventListener('keydown', function (event) {
        if (event.key === 'Enter') {
            const pokemonIdOrName = searchInput.value.trim().toLowerCase();
            if (pokemonIdOrName) {
                fetchPokemonData(pokemonIdOrName);
            }
        }
    });

    function fetchPokemonData(pokemonIdOrName) {
        fetch(`https://pokeapi.co/api/v2/pokemon/${pokemonIdOrName}`)
            .then(response => response.json())
            .then(data => {
                const types = data.types.map(typeInfo => typeInfo.type.name);
                const typeBoxes = types.map(type => `<span class="type-box ${type}">${translateType(type)}</span>`).join('');
                document.getElementById('pokemon-name').textContent = data.name;
                document.getElementById('pokemon-image').src = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${data.id}.png`;
                document.getElementById('pokemon-id').textContent = `Número da Pokédex: #${data.id}`;
                fetch(data.species.url)
                    .then(response => response.json())
                    .then(speciesData => {
                        const generation = speciesData.generation.name.replace('generation-', '').toUpperCase();
                        document.getElementById('pokemon-generation').textContent = `Geração: ${generation}`;
                        const flavorTextEntry = speciesData.flavor_text_entries.find(entry => entry.language.name === 'en');
                        document.getElementById('pokemon-biography').textContent = flavorTextEntry ? flavorTextEntry.flavor_text : 'Nenhuma descrição disponível.';
                        fetch(speciesData.evolution_chain.url)
                            .then(response => response.json())
                            .then(evolutionData => {
                                const evolutions = getAllEvolutionDetails(evolutionData.chain);
                                const evolutionHtml = evolutions.map(evolution => `
                                    <div>
                                        <img src="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${evolution.id}.png" alt="${evolution.name}" class="evolution-sprite" data-name="${evolution.name}">
                                        <p>${evolution.name}</p>
                                    </div>
                                `).join('');
                                document.getElementById('pokemon-evolution-names').innerHTML = evolutionHtml;

                                document.querySelectorAll('.evolution-sprite').forEach(img => {
                                    img.addEventListener('click', function () {
                                        fetchPokemonData(img.dataset.name);
                                    });
                                });
                            });
                    });

                const weaknessesPromises = types.map(type =>
                    fetch(`https://pokeapi.co/api/v2/type/${type}`)
                        .then(response => response.json())
                        .then(typeData => {
                            const weaknesses = typeData.damage_relations.double_damage_from.map(weakness => weakness.name);
                            return weaknesses;
                        })
                );

                Promise.all(weaknessesPromises).then(weaknessArrays => {
                    const allWeaknesses = [...new Set(weaknessArrays.flat())];
                    const weaknessesList = allWeaknesses.map(weakness => `<li class="type-box ${weakness}">${translateType(weakness)}</li>`).join('');
                    document.getElementById('pokemon-weaknesses').innerHTML = weaknessesList;
                });

                document.getElementById('pokemon-types').innerHTML = typeBoxes;
            })
            .catch(error => {
                console.error('Erro ao buscar dados do Pokémon:', error);
                alert('Pokémon não encontrado.');
            });
    }
    function getAllEvolutionDetails(chain, seen = new Set()) {
        let evolutions = [];
        let currentChain = chain;
        while (currentChain) {
            const speciesId = currentChain.species.url.split('/').slice(-2, -1)[0];
            if (!seen.has(speciesId)) {
                seen.add(speciesId);
                evolutions.push({
                    name: currentChain.species.name,
                    id: speciesId
                });
                if (currentChain.evolves_to.length > 0) {
                    currentChain = currentChain.evolves_to[0];
                } else {
                    currentChain = null;
                }
            } else {
                break;
            }
        }
        return evolutions;
    }
    function translateType(type) {
        const typeTranslations = {
            fire: 'Fogo',
            water: 'Água',
            grass: 'Grama',
            electric: 'Elétrico',
            ice: 'Gelo',
            fighting: 'Lutador',
            poison: 'Venenoso',
            ground: 'Terrestre',
            flying: 'Voador',
            psychic: 'Psíquico',
            bug: 'Inseto',
            rock: 'Pedra',
            ghost: 'Fantasma',
            dragon: 'Dragão',
            dark: 'Sombrio',
            steel: 'Aço',
            fairy: 'Fada',
            normal: 'Normal'
        };
        return typeTranslations[type] || type;
    }
});
