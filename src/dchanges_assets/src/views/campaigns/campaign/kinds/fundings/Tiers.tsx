import React, { useCallback } from "react";
import { CampaignInfo, FundingTier } from "../../../../../../../declarations/dchanges/dchanges.did";
import Button from "../../../../../components/Button";
import NumberField from "../../../../../components/NumberField";
import TextAreaField from "../../../../../components/TextAreaField";
import TextField from "../../../../../components/TextField";
import { decimalToIcp, icpToDecimal } from "../../../../../libs/icp";

interface Props {
    info: CampaignInfo;
    disabled?: boolean;
    onChange: (tiers: FundingTier[]) => void;
    onChangeItem: (name: string, value: any, index: number) => void;
};

export const Tiers = (props: Props) => {
    const info = props.info;
    
    const tiers = 'funding' in info? 
        info.funding.tiers: 
        [];

    const handleChange = useCallback((e: any, index: number) => {
        const field = e.target.name || e.target.id;
        const value = e.target.value;
        props.onChangeItem(
            field, 
            field !== 'value'? 
                value:
                decimalToIcp(value), 
            index
        );
    }, [props.onChangeItem]);

    const handleCreate = useCallback((e: any) => {
        e.preventDefault();
        props.onChange(tiers.concat({
            title: '',
            desc: '',
            total: 0,
            max: 0,
            value: BigInt(0),
        }));
    }, [tiers, props.onChange]);

    const handleDelete = useCallback((index: number) => {
        props.onChange(tiers.filter((tier, i) => i !== index));
    }, [tiers, props.onChange]);

    const handleMoveUp = useCallback((index: number) => {
        const to = Array.from(tiers);
        const tmp = to[index-1];
        to[index-1] = to[index];
        to[index] = tmp;
        props.onChange(to);
    }, [tiers, props.onChange]);

    const handleMoveDown = useCallback((index: number) => {
        const to = Array.from(tiers);
        const tmp = to[index+1];
        to[index+1] = to[index];
        to[index] = tmp;
        props.onChange(to);
    }, [tiers, props.onChange]);

    return (
        <>
            <label className="label">Tiers</label>
            <div className="p-2 border">
                {tiers.map((tier, index) => 
                    <div key={index} className="tier-container">
                        <div className="bar">
                            <div>
                                <b>Tier {1+index}</b>
                            </div>
                            <div
                                className="buttons"
                            >
                                <div
                                    className={index === 0 || props.disabled? 'disabled': ''}
                                    onClick={index > 0 && !props.disabled? () => handleMoveUp(index): undefined}
                                >
                                    <i className="la la-chevron-circle-up" />
                                </div>
                                <div
                                    className={index === tiers.length-1 || props.disabled? 'disabled': ''}
                                    onClick={index < tiers.length-1 && !props.disabled? () => handleMoveDown(index): undefined}
                                >
                                    <i className="la la-chevron-circle-down" />
                                </div>
                                <div
                                    className={props.disabled? 'disabled': ''}
                                    onClick={!props.disabled? () => handleDelete(index): undefined}
                                >
                                    <i className="la la-times-circle" />
                                </div>
                            </div>
                        </div>
                        <TextField
                            label="Title"
                            name="title"
                            value={tier.title}
                            required
                            onChange={(e) => handleChange(e, index)}
                        />
                        <TextAreaField
                            label="Description"
                            name="desc"
                            value={tier.desc}
                            rows={3}
                            required
                            onChange={(e) => handleChange(e, index)}
                        />
                        <NumberField
                            label="Max"
                            name="max"
                            value={tier.max}
                            required
                            onChange={(e) => handleChange(e, index)}
                        />
                        <TextField
                            label="Value"
                            name="value"
                            value={icpToDecimal(tier.value)}
                            required
                            onChange={(e) => handleChange(e, index)}
                        />
                    </div>
                )}
                <div className="mt-2">
                    <Button
                        disabled={props.disabled}
                        onClick={handleCreate}
                    >
                        Add
                    </Button>
                </div>
            </div>
        </>
    );
};