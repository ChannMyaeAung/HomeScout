"use client";
import ErrorComponent from "@/components/ErrorComponent";
import Loading from "@/components/Loading";
import {
  useGetAuthUserQuery,
  useGetLeasesQuery,
  useGetPaymentsQuery,
  useGetPropertyQuery,
} from "@/state/api";
import { useParams } from "next/navigation";
import ResidenceCard from "./ResidenceCard";
import PaymentMethod from "./PaymentMethod";
import BillingHistory from "./BillingHistory";

const Residence = () => {
  const { id } = useParams();
  const { data: authUser } = useGetAuthUserQuery();

  const {
    data: property,
    isLoading: propertyLoading,
    error: propertyError,
  } = useGetPropertyQuery(Number(id));

  const {
    data: leases,
    isLoading: leasesLoading,
    error: leasesError,
  } = useGetLeasesQuery(parseInt(authUser?.cognitoInfo?.userId || "0"), {
    skip: !authUser?.cognitoInfo?.userId, // only fetch leases if we have a valid user ID
  });

  const {
    data: payments,
    isLoading: paymentsLoading,
    error: paymentsError,
  } = useGetPaymentsQuery(leases?.[0]?.id || 0, {
    skip: !leases?.[0]?.id, // only fetch payments if we have a valid lease ID
  });

  if (propertyLoading || leasesLoading || paymentsLoading) return <Loading />;
  if (!property || propertyError)
    return <ErrorComponent message="Failed to load property details." />;

  const currentLease = leases?.find(
    (lease) => lease.propertyId === property.id,
  );

  return (
    <div className="dashboard-container">
      <div className="w-full mx-auto">
        <div className="md:flex gap-10">
          '
          {currentLease && (
            <ResidenceCard property={property} currentLease={currentLease} />
          )}
          <PaymentMethod />
        </div>
        <BillingHistory payments={payments || []} />
      </div>
    </div>
  );
};
export default Residence;
