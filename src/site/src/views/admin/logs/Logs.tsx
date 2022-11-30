import React, { useCallback, useState } from "react";
import TimeFromNow from "../../../components/TimeFromNow";
import Badge from "../../../components/Badge";
import { useFindLogs } from "../../../hooks/logs";
import { findAll, kindToColor, kindToText } from "../../../libs/logs";
import { Paginator } from "../../../components/Paginator";
import { JsonStringfy, limitText } from "../../../libs/utils";
import { Msg } from "../../../../../declarations/logger/logger.did";
import Modal from "../../../components/Modal";
import View from "./View";
import saveAs from "file-saver";
import Button from "../../../components/Button";
import { Principal } from "@dfinity/candid/lib/cjs/idl";

interface Props {
}

const Logs = (props: Props) => {
    const [log, setLog] = useState<Msg>();
    const [limit, setLimit] = useState({
        offset: 0,
        size: 10
    });
    const [modals, setModals] = useState({
        view: false
    });

    const logs = useFindLogs(limit.offset, limit.size);

    const toggleView = useCallback(() => {
        setModals(modals => ({
            ...modals,
            view: !modals.view
        }));
    }, []);

    const handleView = useCallback((log: Msg) => {
        setLog(log);
        toggleView();
    }, []);

    const handlePrevPage = useCallback(() => {
        setLimit(limit => ({
            ...limit,
            offset: Math.max(0, limit.offset - limit.size)|0
        }));
    }, []);

    const handleNextPage = useCallback(() => {
        setLimit(limit => ({
            ...limit,
            offset: limit.offset + limit.size
        }));
    }, []);

    const handleExport = useCallback(async () => {
        const items = await findAll(0, 1000);
        const blob = new Blob([JsonStringfy(items.map(i => ({...i, act: Principal.valueToString(i.act)})))], {type: "text/plain;charset=utf-8"});
        saveAs(blob, "logs.json");
    }, []);

    return (
        <>
            <div className="level">
                <div className="level-left">
                    <div className="is-size-2"><i className="la la-flag"/> <b>Logs</b></div>
                </div>
                <div className="level-right">
                    <div>
                    </div>
                </div>
            </div>
            <div>
                <div className="tabled">
                    <div className="header">
                        <div className="columns">
                            <div className="column is-1">
                                Kind
                            </div>
                            <div className="column is-2">
                                Actor
                            </div>
                            <div className="column">
                                Message
                            </div>
                            <div className="column is-1">
                                Age
                            </div>
                        </div>
                    </div>
                    <div className="body">
                        {logs.isSuccess && logs.data && 
                            logs.data.map((log, index) => 
                                <div 
                                    className="columns" 
                                    key={index}
                                    onClick={() => handleView(log)}
                                >
                                    <div className="column is-1">
                                        <Badge color={kindToColor(log.kind)}>{kindToText(log.kind)}</Badge>
                                    </div>
                                    <div className="column is-2">
                                        {log.act.toString()}
                                    </div>
                                    <div className="column">
                                        {limitText(log.msg, 80)}
                                    </div>
                                    <div className="column is-1">
                                        <TimeFromNow date={log.date}/>
                                    </div>
                                </div>
                            )
                        }
                    </div>
                </div>
                <Paginator
                    limit={limit}
                    length={logs.data?.length}
                    onPrev={handlePrevPage}
                    onNext={handleNextPage}
                />
            </div>

            <div className="level mt-5">
                <div className="level-left">
                </div>
                <div className="level-right">
                    <div className="buttons">
                        <Button
                            color="info"
                            onClick={handleExport}
                        >
                            <i className="la la-arrow-circle-down" />&nbsp;Export
                        </Button>
                    </div>
                </div>
            </div>

            <Modal
                header={<span>View log</span>}
                isOpen={modals.view}
                onClose={toggleView}
            >
                {log &&
                    <View
                        log={log}
                        onClose={toggleView}
                    />
                }
            </Modal>
        </>
    );
};

export default Logs;