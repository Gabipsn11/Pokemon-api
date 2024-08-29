document.addEventListener('DOMContentLoaded', function () {
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

    function getAllEvolutionDetails(chain) {
        let evolutions = [];
        
        function traverseEvolutionChain(chain) {
            const speciesId = chain.species.url.split('/').slice(-2, -1)[0];
            evolutions.push({
                name: chain.species.name,
                id: speciesId
            });

            chain.evolves_to.forEach(evolution => {
                traverseEvolutionChain(evolution);
            });
        }

        traverseEvolutionChain(chain);
        return evolutions;
    }

    function translateType(type) {
        const typeTranslations = {
            normal: 'Normal',
            fire: 'Fogo',
            water: 'Água',
            electric: 'Elétrico',
            grass: 'Grama',
            ice: 'Gelo',
            fighting: 'Lutador',
            poison: 'Veneno',
            ground: 'Terra',
            flying: 'Voador',
            psychic: 'Psíquico',
            bug: 'Inseto',
            rock: 'Pedra',
            ghost: 'Fantasma',
            dragon: 'Dragão',
            dark: 'Noturno',
            steel: 'Metálico',
            fairy: 'Fada'
        };
        return typeTranslations[type] || type;
    }

    document.getElementById('pokemon-form').addEventListener('submit', function (e) {
        e.preventDefault();
        const pokemonName = document.getElementById('pokemon-input').value.trim().toLowerCase();
        fetchPokemonData(pokemonName);
    });
});
