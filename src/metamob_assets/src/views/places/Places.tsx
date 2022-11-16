import React, {lazy, Suspense, useState, useCallback, useEffect, Fragment, useMemo, useRef} from "react";
import {Filter, Order} from "../../libs/common";
import {useFindPlacesInf} from "../../hooks/places";
import Button from "../../components/Button";
import { sortByKind } from "./Sort";
import Item from "./Item";
import { Bar } from "./Bar";
import { Place } from "../../../../declarations/metamob/metamob.did";
import { useNavigate, useParams } from "react-router-dom";
import Skeleton from "react-loading-skeleton";
import { FormattedMessage } from "react-intl";
import { GlobeMethods } from "react-globe.gl";

const Globe = lazy(() => import("react-globe.gl"));

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
    const [altitude, setAltitude] = useState(2.5);
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
        { 
            key: 'lat',
            op: 'between',
            value: null
        },
        { 
            key: 'lng',
            op: 'between',
            value: null
        }
    ]);
    const [orderBy, setOrderBy] = useState<Order[]>(sortByKind);

    const params = useParams();
    const mode = params.mode && params.mode === 'map'? Modes.MAP: Modes.LIST;

    const globe = useRef<GlobeMethods>();

    const navigate = useNavigate();
    
    const places = useFindPlacesInf(filters, orderBy, 20);

    const handleChangeFilters = useCallback((filters: Filter[]) => {
        setFilters(filters);
    }, []);

    const handleChangeSort = useCallback((orderBy: Order[]) => {
        setOrderBy(orderBy);
    }, []);

    const handleSearchMap = useCallback(() => {
        if(globe.current) {
            const center = globe.current.toGlobeCoords((size.w / 2)|0, (size.h / 2)|0);
            if(center) {
                const topleft = globe.current.toGlobeCoords(0, 0) || {lat: (center?.lat||0.0) - -7.500001, lng: (center?.lng||0.0) + -30.000001};
                const bottomright = globe.current.toGlobeCoords(size.w, size.h) || {lat: (center?.lat||0.0) + -7.500001, lng: (center?.lng||0.0) + 30.000001};
                setFilters(filters => ([
                    ...filters.filter(f => f.key !== 'lat' && f.key !== 'lng'), 
                    {
                        key: 'lat', 
                        op: 'between', 
                        value: topleft.lat < bottomright.lat? [topleft.lat, bottomright.lat]: [bottomright.lat, topleft.lat]
                    },
                    {
                        key: 'lng', 
                        op: 'between', 
                        value: topleft.lng < bottomright.lng? [topleft.lng, bottomright.lng]: [bottomright.lng, topleft.lng]
                    }
                ]));
            }
        }
    }, [globe.current, size, altitude]);

    const handleSwitchMode = useCallback(() => {
        navigate(`/places/${mode === Modes.LIST? 'map': 'list'}`)
    }, [mode]);

    const handleRedirect = useCallback((place: Object, ...rest: any[]) => {
        navigate(`/p/${(place as Place).pubId}`);
    }, []);

    const handleZoom = useCallback((pos: {lat: number, lng: number, altitude: number}) => {
        setAltitude(pos.altitude);
    }, [globe.current]);

    const getPlaceLabelName = useCallback((p: Place|any) => {
        return p.name;
    }, []);

    const getPlaceLabelSize = useCallback((p: Place|any) => {
        return 4 / (1 + p.kind);
    }, []);

    const getPlaceLabelRadius = useCallback((p: Place|any) => {
        return 4 / (1 + p.kind);
    }, []);

    const getPlaceLabelColor = useCallback(() => '#fffffff0', []);

    useEffect(() => {
        props.toggleLoading(places.status === "loading");
        if(places.status === "error") {
            props.onError(places.error.message);
        }
    }, [places.status]);

    useEffect(() => {
        setSize({w: calcWidth(), h: calcHeight()})
    }, [window.innerWidth, window.innerHeight])

    const data = useMemo(() => {
        return places.data?.pages.flat()
            .filter(place => {
                const k = place.kind * altitude;
                return k >= 1.0 && k <= 2.55;
            });
    }, [places.data?.pages, altitude]);

    return (
        <div className="container places">
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
                    <Suspense fallback={
                        <div className="has-text-centered">
                            <div style={{height: 100}} />
                            <Skeleton circle width={400} height={400} />
                            <div style={{height: 100}} />
                        </div>
                    }>
                        <Globe
                            ref={globe}
                            width={size.w}
                            height={size.h}
                            globeImageUrl="/earth-day.jpg"
                            backgroundColor="#fff"
                            showAtmosphere={false}
                            labelsData={data}
                            labelText={getPlaceLabelName}
                            labelSize={getPlaceLabelSize}
                            labelDotRadius={getPlaceLabelRadius}
                            labelColor={getPlaceLabelColor}
                            onLabelClick={handleRedirect}
                            labelsTransitionDuration={100}
                            labelResolution={2}
                            labelAltitude={0.01}
                            onZoom={handleZoom}
                        />
                    </Suspense>
                </div>
            :
                <div className="columns is-desktop is-multiline is-align-items-center">
                    {places.status === 'success'? 
                        places.data.pages.map((page, index) => 
                            <Fragment key={index}>
                                {page.map((place) => 
                                    <div 
                                        className="column is-3"
                                        key={place._id}
                                    >
                                        <Item 
                                            key={place._id} 
                                            place={place} />
                                    </div>
                                )}
                            </Fragment>
                        )
                    :
                        Array.from([1,2,3,4,5,6,7,8]).map(index => 
                            <div 
                                className="column is-3"
                                key={index}
                            >
                                <div className="image is-4by3" style={{minHeight: '325px'}}>
                                    <Skeleton className="is-overlay" style={{position: 'absolute'}} />
                                </div>
                                <Skeleton height={200} />
                            </div>
                        )
                    }
                </div>        
            }

            <div className="has-text-centered mt-4">
                <div className="control">
                    {mode === Modes.MAP &&
                        <>
                            <Button 
                                color="warning"
                                onClick={handleSearchMap}
                            >
                                <i className="la la-globe"/>&nbsp;<FormattedMessage id="Search here" defaultMessage="Search here" />
                            </Button>
                            &nbsp;
                        </>
                    }

                    <Button
                        disabled={!places.hasNextPage || places.isFetchingNextPage}
                        onClick={() => places.fetchNextPage()}
                    >
                        <i className="la la-sync" />&nbsp;<FormattedMessage id={places.hasNextPage? 'Load more': 'All loaded'} defaultMessage={places.hasNextPage? 'Load more': 'All loaded'}/>
                    </Button>
                </div>
            </div>
  
        </div>
    );
};

export default Places;
  