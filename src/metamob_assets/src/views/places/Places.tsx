import React, {useState, useCallback, useEffect, Fragment} from "react";
import Globe from "react-globe.gl";
import {Filter, Order} from "../../libs/common";
import {useFindPlacesInf} from "../../hooks/places";
import Button from "../../components/Button";
import { sortByKind } from "./Sort";
import Item from "./Item";
import { Bar } from "./Bar";
import { Place } from "../../../../declarations/metamob/metamob.did";
import { useNavigate } from "react-router-dom";

interface Props {
    onSuccess: (message: string) => void;
    onError: (message: any) => void;
    toggleLoading: (to: boolean) => void;
}

export enum Modes {
    LIST,
    MAP,
}

const calcWidth = () => {
    return Math.max(300, window.innerWidth * .5)|0;
}

const calcHeight = () => {
    return Math.max(300, window.innerHeight * .7)|0;
}


const Places = (props: Props) => {
    const [size, setSize] = useState({w: calcWidth(), h: calcHeight()});
    const [mode, setMode] = useState(Modes.MAP);
    const [filters, setFilters] = useState<Filter[]>([
        {
            key: 'name',
            op: 'contains',
            value: ''
        },
        {
            key: 'kind',
            op: 'eq',
            value: null
        },
        {
            key: 'active',
            op: 'eq',
            value: true
        },
    ]);
    const [orderBy, setOrderBy] = useState<Order[]>(sortByKind);

    const navigate = useNavigate();

    const places = useFindPlacesInf(filters, orderBy, 8);

    const handleChangeFilters = useCallback((filters: Filter[]) => {
        setFilters(filters);
    }, []);

    const handleChangeSort = useCallback((orderBy: Order[]) => {
        setOrderBy(orderBy);
    }, []);

    const handleSwitchMode = useCallback(() => {
        setMode(mode => mode === Modes.LIST? Modes.MAP: Modes.LIST);
    }, []);

    const handleRedirect = useCallback((place: Place) => {
        navigate(`/p/${place.pubId}`);
    }, []);

    useEffect(() => {
        props.toggleLoading(places.status === "loading");
        if(places.status === "error") {
            props.onError(places.error.message);
        }
    }, [places.status]);

    useEffect(() => {
        setSize({w: calcWidth(), h: calcHeight()})
    }, [window.innerWidth, window.innerHeight])

    console.log(places.data?.pages.flat())

    return (
        <div className="container">
            <Bar
                filters={filters}
                orderBy={orderBy}
                mode={mode}
                onSearch={handleChangeFilters}
                onSort={handleChangeSort}
                onSwitchMode={handleSwitchMode}
                onSuccess={props.onSuccess}
                onError={props.onError}
                toggleLoading={props.toggleLoading}
            />

            {mode === Modes.MAP?
                <div>
                    <Globe
                        rendererConfig={{ antialias: false }}
                        width={size.w}
                        height={size.h}
                        globeImageUrl="/earth-day.jpg"
                        backgroundColor="#fff"
                        showAtmosphere={false}
                        labelsData={places.data?.pages.flat()}
                        labelText={(p: Place|any) => p.name}
                        labelSize={(p: Place|any) => 4 / (1 + p.kind)}
                        labelDotRadius={(p: Place|any) => 4 / (1 + p.kind)}
                        labelColor={() => 'rgba(255, 165, 0, 0.9)'}
                        onLabelClick={(p: Place|any) => handleRedirect(p)}
                        labelResolution={2}
                        labelAltitude={0.01}
                    />
                </div>
            :
                <div className="columns is-desktop is-multiline is-align-items-center">
                    {places.status === 'success' && 
                        places.data && 
                            places.data.pages.map((page, index) => 
                        <Fragment key={index}>
                            {page.map((place) => 
                                <div 
                                    className="column is-half"
                                    key={place._id}
                                >
                                    <Item 
                                        key={place._id} 
                                        place={place} />
                                </div>
                            )}
                        </Fragment>
                    )}
                </div>        
            }

            <div className="has-text-centered mt-4">
                <div className="control">
                    <Button
                        disabled={!places.hasNextPage || places.isFetchingNextPage}
                        onClick={() => places.fetchNextPage()}
                    >
                        <i className="la la-sync" />&nbsp;{places.hasNextPage? 'Load more': 'All loaded'}
                    </Button>
                </div>
            </div>
  
        </div>
    );
};

export default Places;
  