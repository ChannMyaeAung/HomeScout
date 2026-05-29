"use client";
import ApplicationCard from "@/components/ApplicationCard";
import ErrorComponent from "@/components/ErrorComponent";
import Header from "@/components/Header";
import Loading from "@/components/Loading";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  useGetApplicationsQuery,
  useGetAuthUserQuery,
  useUpdateApplicationStatusMutation,
} from "@/state/api";
import { CircleCheckBig, Download, File, Hospital } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

const Applications = () => {
  const { data: authUser } = useGetAuthUserQuery();
  const [activeTab, setActiveTab] = useState("all");

  const {
    data: applications,
    isLoading,
    isError,
  } = useGetApplicationsQuery(
    { userId: authUser?.cognitoInfo?.userId, userType: "manager" },
    { skip: !authUser?.cognitoInfo?.userId },
  );

  const [updateApplicationStatus] = useUpdateApplicationStatusMutation();

  const handleStatusChange = async (id: number, status: string) => {
    await updateApplicationStatus({ id, status });
  };

  if (isLoading) return <Loading />;
  if (isError) return <ErrorComponent message="Failed to load applications." />;

  const filteredApplications = applications?.filter((app) => {
    if (activeTab === "all") return true;
    return app.status.toLowerCase() === activeTab;
  });

  return (
    <div className="dashboard-container">
      <Header
        title="Applications"
        subtitle="View and manage applications for your properties"
      />
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="w-full my-5"
      >
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="pending">Pending</TabsTrigger>
          <TabsTrigger value="approved">Approved</TabsTrigger>
          <TabsTrigger value="denied">Denied</TabsTrigger>
        </TabsList>
        {["all", "pending", "approved", "denied"].map((tab) => (
          <TabsContent key={tab} value={tab} className="mt-5 w-full">
            {filteredApplications
              ?.filter(
                (application) =>
                  tab === "all" || application.status.toLowerCase() === tab,
              )
              .map((app) => (
                <ApplicationCard
                  key={app.id}
                  application={app}
                  userType="manager"
                >
                  <div className="flex justify-between gap-5 w-full pb-4 px-4">
                    {/* Colored Section Status */}
                    <div
                      className={`p-4 text-green-700 grow ${app.status === "Approved" ? "bg-green-100" : app.status === "Denied" ? "bg-red-100" : "bg-yellow-100"} `}
                    >
                      <div className="flex flex-wrap items-center">
                        <File className="w-5 h-5 mr-2 shrink-0" />
                        <span className="mr-2">
                          Application submitted on{" "}
                          {new Date(app.applicationDate).toLocaleDateString()}
                        </span>
                        <CircleCheckBig className="w-5 h-5 mr-2 shrink-0" />
                        <span
                          className={`font-semibold ${app.status === "Approved" ? "text-green-800" : app.status === "Denied" ? "text-red-800" : "text-yellow-800"}`}
                        >
                          {app.status === "Approved" &&
                            "This application has been approved."}
                          {app.status === "Denied" &&
                            "This application has been denied."}
                          {app.status === "Pending" &&
                            "This application is pending review."}
                        </span>
                      </div>
                    </div>

                    {/* Right Buttons */}
                    <div className="flex gap-2">
                      <Link
                        href={`/managers/properties/${app.property.id}`}
                        className={`bg-white border border-gray-300 text-gray-700 py-2 px-4 rounded-md flex items-center hover:bg-primary-700 hover:text-primary-50`}
                        scroll={false}
                      >
                        <Hospital className="w-5 h-5 mr-2" />
                        Property Details
                      </Link>
                      {app.status === "Approved" && (
                        <button className="bg-white border border-gray-300 text-gray-700 py-2 px-4 rounded-md flex items-center justify-center hover:bg-primary-700 hover:text-primary-50">
                          <Download className="w-5 h-5 mr-2" />
                          Download Agreement
                        </button>
                      )}

                      {app.status === "Pending" && (
                        <>
                          <button
                            className="px-4 py-4 text-sm text-white bg-green-600 rounded hover:bg-green-500"
                            onClick={() =>
                              handleStatusChange(app.id, "Approved")
                            }
                          >
                            Approve
                          </button>
                          <button
                            className="px-4 py-4 text-sm text-white bg-red-600 rounded hover:bg-red-500"
                            onClick={() => handleStatusChange(app.id, "Denied")}
                          >
                            Deny
                          </button>
                        </>
                      )}
                      {app.status === "Denied" && (
                        <button className="bg-gray-800 text-white py-2 px-4 rounded-md flex items-center justify-center hover:bg-secondary-500 hover:text-primary-50">
                          Contact User
                        </button>
                      )}
                    </div>
                  </div>
                </ApplicationCard>
              ))}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
};
export default Applications;
