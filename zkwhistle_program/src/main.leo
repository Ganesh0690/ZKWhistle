program zkwhistle_kumar_v1.aleo {

    @noupgrade
    async constructor() {}

    struct OrgInfo {
        name_hash: field,
        admin: address,
        member_count: u64,
        report_count: u64,
        is_active: bool,
    }

    struct ReportInfo {
        org_id: field,
        content_hash: field,
        severity: u8,
        block_height: u32,
        status: u8,
        report_index: u64,
    }

    mapping organizations: field => OrgInfo;
    mapping members: field => bool;
    mapping reports: field => ReportInfo;
    mapping org_count: u8 => u64;
    mapping total_reports: u8 => u64;
    mapping org_report_index: field => u64;

    async transition register_org(
        public org_id: field,
        public name_hash: field,
    ) -> Future {
        let f: Future = finalize_register_org(org_id, name_hash, self.caller);
        return f;
    }

    async function finalize_register_org(
        org_id: field,
        name_hash: field,
        admin: address,
    ) {
        let exists: bool = Mapping::contains(organizations, org_id);
        assert(!exists);

        let org: OrgInfo = OrgInfo {
            name_hash: name_hash,
            admin: admin,
            member_count: 0u64,
            report_count: 0u64,
            is_active: true,
        };
        Mapping::set(organizations, org_id, org);

        let count: u64 = Mapping::get_or_use(org_count, 0u8, 0u64);
        Mapping::set(org_count, 0u8, count + 1u64);
    }

    async transition add_member(
        public org_id: field,
        public member_hash: field,
    ) -> Future {
        let f: Future = finalize_add_member(org_id, member_hash, self.caller);
        return f;
    }

    async function finalize_add_member(
        org_id: field,
        member_hash: field,
        caller: address,
    ) {
        let org: OrgInfo = Mapping::get(organizations, org_id);
        assert_eq(org.admin, caller);
        assert(org.is_active);

        Mapping::set(members, member_hash, true);

        let updated: OrgInfo = OrgInfo {
            name_hash: org.name_hash,
            admin: org.admin,
            member_count: org.member_count + 1u64,
            report_count: org.report_count,
            is_active: org.is_active,
        };
        Mapping::set(organizations, org_id, updated);
    }

    async transition submit_report(
        private org_id: field,
        private member_secret: field,
        public report_id: field,
        public content_hash: field,
        public severity: u8,
    ) -> Future {
        let member_hash: field = BHP256::hash_to_field(member_secret);
        let f: Future = finalize_submit_report(
            org_id,
            member_hash,
            report_id,
            content_hash,
            severity,
        );
        return f;
    }

    async function finalize_submit_report(
        org_id: field,
        member_hash: field,
        report_id: field,
        content_hash: field,
        severity: u8,
    ) {
        let is_member: bool = Mapping::get(members, member_hash);
        assert(is_member);

        let org: OrgInfo = Mapping::get(organizations, org_id);
        assert(org.is_active);

        let report_exists: bool = Mapping::contains(reports, report_id);
        assert(!report_exists);

        let report: ReportInfo = ReportInfo {
            org_id: org_id,
            content_hash: content_hash,
            severity: severity,
            block_height: 0u32,
            status: 0u8,
            report_index: org.report_count,
        };
        Mapping::set(reports, report_id, report);

        let updated_org: OrgInfo = OrgInfo {
            name_hash: org.name_hash,
            admin: org.admin,
            member_count: org.member_count,
            report_count: org.report_count + 1u64,
            is_active: org.is_active,
        };
        Mapping::set(organizations, org_id, updated_org);

        let total: u64 = Mapping::get_or_use(total_reports, 0u8, 0u64);
        Mapping::set(total_reports, 0u8, total + 1u64);

        Mapping::set(org_report_index, report_id, org.report_count);
    }

    async transition update_report_status(
        public org_id: field,
        public report_id: field,
        public new_status: u8,
    ) -> Future {
        let f: Future = finalize_update_status(org_id, report_id, new_status, self.caller);
        return f;
    }

    async function finalize_update_status(
        org_id: field,
        report_id: field,
        new_status: u8,
        caller: address,
    ) {
        let org: OrgInfo = Mapping::get(organizations, org_id);
        assert_eq(org.admin, caller);

        let report: ReportInfo = Mapping::get(reports, report_id);
        assert_eq(report.org_id, org_id);

        let updated: ReportInfo = ReportInfo {
            org_id: report.org_id,
            content_hash: report.content_hash,
            severity: report.severity,
            block_height: report.block_height,
            status: new_status,
            report_index: report.report_index,
        };
        Mapping::set(reports, report_id, updated);
    }

    transition compute_member_hash(private secret: field) -> public field {
        return BHP256::hash_to_field(secret);
    }
}
