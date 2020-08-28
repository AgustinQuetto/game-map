import React, { useState, useEffect } from "react";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import LDraw from "leaflet-draw";

const mapdata = require("./gameData/mapdata.json");

function App() {
    let map = null;
    const [edit, setEdit] = useState("");
    const [ready, setReady] = useState(false);

    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        setEdit(urlParams.get("edit"));
        initMap();
    }, []);

    const initMap = () => {
        delete L.Icon.Default.prototype._getIconUrl;

        const questIcon = require("./quest.png");

        L.Icon.Default.mergeOptions({
            iconRetinaUrl: questIcon,
            iconUrl: questIcon,
            iconSize: [32, 32],
            iconAnchor: [16, 24],
            shadowUrl: "",
        });

        L.drawLocal = {
            draw: {
                toolbar: {
                    actions: {
                        title: "Cancelar",
                        text: "Cancelar",
                    },
                    finish: {
                        title: "Finalizar",
                        text: "Finalizar",
                    },
                    undo: {
                        title: "Revertir",
                        text: "Revertir",
                    },
                    buttons: {
                        polyline: "Polilínea",
                        polygon: "Polígono",
                        rectangle: "Rectángulo",
                        circle: "Círculo",
                        marker: "Marcador",
                        circlemarker: "Circunferencia",
                    },
                },
                handlers: {
                    circle: {
                        tooltip: {
                            start: "Presiona para crear un círculo.",
                        },
                        radius: "Radio",
                    },
                    circlemarker: {
                        tooltip: {
                            start: "Presione para crear un círculo marcador.",
                        },
                    },
                    marker: {
                        tooltip: {
                            start: "Presione para crear un marcador.",
                        },
                    },
                    polygon: {
                        tooltip: {
                            start: "Presione para comenzar un polígono.",
                            cont:
                                "Presione en otro punto para extender el área.",
                            end:
                                "Presione en el primer punto para cerrar el polígono.",
                        },
                    },
                    polyline: {
                        error:
                            "<strong>Error:</strong> las formas no pueden cruzarse.",
                        tooltip: {
                            start: "Presiona en un sitio para comenzar.",
                            cont: "Presiona en un sitio para extender.",
                            end: "Presiona el último punto para finalizar.",
                        },
                    },
                    rectangle: {
                        tooltip: {
                            start: "Presiona para comenzar el área.",
                        },
                    },
                    simpleshape: {
                        tooltip: {
                            end: "Suelta para finalizar.",
                        },
                    },
                },
            },
            edit: {
                toolbar: {
                    actions: {
                        save: {
                            title: "Guardar",
                            text: "Guardar",
                        },
                        cancel: {
                            title: "Descartar cambios.",
                            text: "Descartar",
                        },
                        clearAll: {
                            title: "Limpiar todas las capas",
                            text: "Limpiar todo",
                        },
                    },
                    buttons: {
                        edit: "Editar capas",
                        editDisabled: "No hay capas por editar",
                        remove: "Eliminar capas",
                        removeDisabled:
                            "Eliminar capas no se encuentra habilitado",
                    },
                },
                handlers: {
                    edit: {
                        tooltip: {
                            text:
                                "Presiona o arrastra un elemento para editarlo.",
                            subtext: "Presiona para revertir los cambios.",
                        },
                    },
                    remove: {
                        tooltip: {
                            text: "Presione en un elemento para eliminar.",
                        },
                    },
                },
            },
        };

        // let sw = L.latLng(0, 500),
        //   ne = L.latLng(-500, 0);
        // let bounds = L.latLngBounds(sw, ne)

        const southWest = L.latLng(-449.875, 73.6875),
            northEast = L.latLng(-69.5, 368),
            maxBounds = L.latLngBounds(southWest, northEast);
        map = L.map("map", {
            maxBounds: maxBounds,
            minZoom: 1,
            maxZoom: 4,
            center: [-298, 223.5],
            zoom: 1,
            crs: L.CRS.Simple,
            attributionControl: false,
        });

        /* this.addMap(`/static/map.jpg`, 0, 0); */
        /* maps.map(m => {
          this.addMap(`/img/maps/${m.path}.jpg`, m.x, m.y)
        }) */
        for (let row = 1; row < 6; row++) {
            for (let col = 1; col < 5; col++) {
                addMap(`/assets/map/row-${row}-col-${col}.png`, col, row);
            }
        }
        //map.setMaxBounds(bounds)

        addDraw();
        loadGeoJson();
    };

    const addMap = (url, X = 0, Y = 0) => {
        // dimensions of the image
        let w = 588,
            h = 600;

        X = w * X;
        Y = h * Y;

        // calculate the edges of the image, in coordinate space
        let southWest = map.unproject([X, h + Y + 2], map.getMaxZoom() - 1);
        let northEast = map.unproject([w + 2 + X, Y], map.getMaxZoom() - 1);

        let bounds = new L.LatLngBounds(southWest, northEast);

        L.imageOverlay(url, bounds).addTo(map);

        map.on("click", (e) => {
            console.log(e.latlng);
        });
    };

    const addDraw = () => {
        if (edit === "true") {
            let featureGroup = L.featureGroup().addTo(map);

            const customMarker = L.Icon.extend({
                options: {
                    shadowUrl: null,
                    iconAnchor: new L.Point(16, 16),
                    iconSize: new L.Point(32, 32),
                    iconUrl: require("./quest.png"),
                },
            });

            new L.Control.Draw({
                draw: {
                    marker: {
                        icon: new customMarker(),
                    },
                },
                edit: {
                    featureGroup: featureGroup,
                },
            }).addTo(map);

            map.on("draw:created", (e) => {
                // Each time a feaute is created, it's added to the over arching feature group
                featureGroup.addLayer(e.layer);
            });

            // on click, clear all layers
            document.getElementById("delete").onclick = (e) => {
                featureGroup.clearLayers();
            };

            document.getElementById("export").onclick = (e) => {
                // Extract GeoJson from featureGroup
                let data = featureGroup.toGeoJSON();

                // Stringify the GeoJson
                let convertedData =
                    "text/json;charset=utf-8," +
                    encodeURIComponent(JSON.stringify(data));

                // Create export
                document
                    .getElementById("export")
                    .setAttribute("href", "data:" + convertedData);
                document
                    .getElementById("export")
                    .setAttribute("download", "data.geojson");
            };
        }
    };

    const loadGeoJson = () => {
        L.geoJSON(mapdata).addTo(map);
    };

    return (
        <div className="">
            <div id="map" className="map" />

            {edit === "true" && (
                <span>
                    <div id="delete">Eliminar</div>
                    <a href="#" id="export">
                        Guardar
                    </a>
                </span>
            )}

            <style jsx="true">
                {`
                    .leaflet-draw-actions a {
                        background-color: white;
                    }
                    .leaflet-container {
                        background-color: rgba(255, 0, 0, 0);
                    }
                    .sr-only {
                        display: none;
                    }
                    img {
                        height: auto;
                        width: auto;
                    }
                    #ll {
                        position: absolute;
                        bottom: 0;
                        z-index: 9999;
                        background-color: white;
                        color: blue;
                        padding: 20px;
                        text-align: left;
                    }
                    .map {
                        position: absolute;
                        top: 0;
                        left: 0;
                        width: 100%;
                        height: 100%;
                        background-color: black;
                    }
                    #delete,
                    #export {
                        position: absolute;
                        top: 10px;
                        right: 10px;
                        z-index: 100000;
                        background: white;
                        color: black;
                        padding: 6px;
                        border-radius: 4px;
                        font-family: "Helvetica Neue";
                        cursor: pointer;
                        font-size: 12px;
                        text-decoration: none;
                    }
                    #export {
                        top: 40px;
                    }
                `}
            </style>
        </div>
    );
}

export default App;
