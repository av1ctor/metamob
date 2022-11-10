import React from "react";
import { ReportResponse } from "../../../../../declarations/metamob/metamob.did";
import CampaignEdit from "../../campaigns/campaign/EditWrapper";
import SignatureEdit from "../../signatures/signature/EditWrapper";
import VoteEdit from "../../votes/vote/EditWrapper";
import DonationEdit from "../../donations/donation/EditWrapper";
import FundingEdit from "../../fundings/funding/EditWrapper";
import UpdateEdit from "../../updates/update/EditWrapper";
import PlaceEdit from "../../places/place/EditWrapper";
import UserEdit from "../../users/user/EditWrapper";
import PoapEdit from "../../poaps/poap/EditWrapper";
import { EntityType } from "../../../libs/common";

interface Props {
    report: ReportResponse;
    onClose: () => void;
    onSuccess: (message: string) => void;
    onError: (message: any) => void;
    toggleLoading: (to: boolean) => void;
}

const EntityModerate = (props: Props) => {
    const {report} = props; 

    switch(report.entityType) {
        case EntityType.CAMPAIGNS:
            return (
                <CampaignEdit
                    pubId={report.entityPubId}
                    reportId={report._id}
                    onClose={props.onClose}
                    onSuccess={props.onSuccess}
                    onError={props.onError}
                    toggleLoading={props.toggleLoading}
                />
            );

        case EntityType.SIGNATURES:
            return (
                <SignatureEdit
                    pubId={report.entityPubId}
                    reportId={report._id}
                    onClose={props.onClose}
                    onSuccess={props.onSuccess}
                    onError={props.onError}
                    toggleLoading={props.toggleLoading}
                />
            );
        
        case EntityType.UPDATES:
            return (
                <UpdateEdit
                    pubId={report.entityPubId}
                    reportId={report._id}
                    onClose={props.onClose}
                    onSuccess={props.onSuccess}
                    onError={props.onError}
                    toggleLoading={props.toggleLoading}
                />
            );

        case EntityType.VOTES:
            return (
                <VoteEdit
                    pubId={report.entityPubId}
                    reportId={report._id}
                    onClose={props.onClose}
                    onSuccess={props.onSuccess}
                    onError={props.onError}
                    toggleLoading={props.toggleLoading}
                />
            );

        case EntityType.DONATIONS:
            return (
                <DonationEdit
                    pubId={report.entityPubId}
                    reportId={report._id}
                    onClose={props.onClose}
                    onSuccess={props.onSuccess}
                    onError={props.onError}
                    toggleLoading={props.toggleLoading}
                />
            );

        case EntityType.FUNDINGS:
            return (
                <FundingEdit
                    pubId={report.entityPubId}
                    reportId={report._id}
                    onClose={props.onClose}
                    onSuccess={props.onSuccess}
                    onError={props.onError}
                    toggleLoading={props.toggleLoading}
                />
            );

        case EntityType.PLACES:
            return (
                <PlaceEdit
                    pubId={report.entityPubId}
                    reportId={report._id}
                    onClose={props.onClose}
                    onSuccess={props.onSuccess}
                    onError={props.onError}
                    toggleLoading={props.toggleLoading}
                />
            );

        case EntityType.USERS:
            return (
                <UserEdit
                    id={report.entityId}
                    reportId={report._id}
                    onClose={props.onClose}
                    onSuccess={props.onSuccess}
                    onError={props.onError}
                    toggleLoading={props.toggleLoading}
                />
            );

        case EntityType.POAPS:
            return (
                <PoapEdit
                    pubId={report.entityPubId}
                    reportId={report._id}
                    onClose={props.onClose}
                    onSuccess={props.onSuccess}
                    onError={props.onError}
                    toggleLoading={props.toggleLoading}
                />
            );

        default:
            return (
                <div></div>
            );
    }
};

export default EntityModerate;