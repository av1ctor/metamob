import React, { Fragment, useCallback, useEffect, useRef, useState } from "react";
import Skeleton from "react-loading-skeleton";
import { Place } from "../../../../../declarations/metamob/metamob.did";
import { useFindChildrenPlacesInf } from "../../../hooks/places";
import { Filter } from "../../../libs/common";
import { sortByName } from "../../campaigns/Sort";
import Child from "./Child";

interface Props {
    place?: Place;
    visible: boolean;
    onSuccess: (message: string) => void;
    onError: (message: any) => void;
    toggleLoading: (to: boolean) => void;
}

const Children = (props: Props) => {
    const [filters, setFilters] = useState<Filter[]>([
        {
            key: 'name',
            op: 'contains',
            value: ''
        }
    ]);
    
    const containerRef = useRef<HTMLDivElement>(null);

    const places = useFindChildrenPlacesInf(filters, sortByName, 9, props.place);

    const handleLoad = useCallback(() => {
        if(places.hasNextPage && !places.isFetchingNextPage) {
            places.fetchNextPage();
        }
    }, [places])

    const handleScroll = useCallback((event: Event) => {
        const elm = event.target as HTMLDivElement;
        if(elm.scrollWidth - elm.offsetWidth <= elm.scrollLeft) {
            handleLoad();
        }
    }, [handleLoad]);

    useEffect(() => {
        if(containerRef.current) {
            const elm = containerRef.current;
            elm.addEventListener('scroll', handleScroll);
            return () => elm.removeEventListener('scroll', handleScroll);
        }
        else {
            return undefined;
        }
    }, [containerRef, handleScroll]);
    
    return (
        <div 
            ref={containerRef}
            className={`place-children ${!props.visible || (places.isSuccess && (places.data.pages.length == 0 || places.data.pages[0].length === 0))? 'hidden': ''} ${places.isLoading || places.isFetchingNextPage? 'is-loading': ''}`}
        >
            {props.place &&
                places.isSuccess && 
                    places.data? 
                        places.data.pages.map((page, index) => 
                    <Fragment key={index}>
                        {page.map(place => 
                            <Child
                                key={place._id}
                                place={place}
                            />
                        )}
                        
                    </Fragment>
                )
            :
                Array.from([1,2,3]).map(index => 
                    <Skeleton key={index} className="place-child" />
                )
            }
        </div>
    );
};

export default Children;