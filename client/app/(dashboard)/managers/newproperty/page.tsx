"use client";

import { CustomFormField } from "@/components/FormField";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { AmenityEnum, HighlightEnum, PropertyTypeEnum } from "@/lib/constants";
import { PropertyFormData, propertySchema } from "@/lib/schemas";
import { formatEnumString } from "@/lib/utils";
import { useCreatePropertyMutation, useGetAuthUserQuery } from "@/state/api";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { FormProvider, Resolver, useForm } from "react-hook-form";
import { toast } from "sonner";

const enumToOptions = (enumObj: object) =>
  Object.keys(enumObj).map((key) => ({
    value: key,
    label: formatEnumString(key),
  }));

const NewProperty = () => {
  const router = useRouter();
  const [createProperty, { isLoading: isCreating }] =
    useCreatePropertyMutation();
  const { data: authUser } = useGetAuthUserQuery();

  // zodResolver infers the *input* type of the schema, which marks z.coerce fields
  // as `unknown`. Casting aligns it with the *output* type (PropertyFormData).
  const form = useForm<PropertyFormData>({
    resolver: zodResolver(propertySchema) as Resolver<PropertyFormData>,
    defaultValues: {
      name: "",
      description: "",
      pricePerMonth: 1000,
      securityDeposit: 500,
      applicationFee: 100,
      isPetsAllowed: true,
      isParkingIncluded: true,
      photoUrls: [],
      amenities: "",
      highlights: "",
      beds: 1,
      baths: 1,
      squareFeet: 1000,
      propertyType: PropertyTypeEnum.Apartment,
      address: "",
      city: "",
      state: "",
      country: "",
      postalCode: "",
    },
  });

  // react-hook-form calls this only after all Zod validations pass.
  // We use FormData instead of plain JSON because the request includes File
  // objects (photos), and multipart/form-data is the only HTTP encoding that
  // can carry binary file data alongside regular text fields in one request.
  const onSubmit = async (data: PropertyFormData) => {
    if (!authUser?.cognitoInfo?.userId) {
      toast.error("Authentication error. Please sign in again.");
      return;
    }

    const formData = new FormData();

    Object.entries(data).forEach(([key, value]) => {
      if (key === "photoUrls") {
        // Append each File under the key "photos" — the backend reads req.files["photos"].
        // Appending individually lets multer receive them as an array on the server.
        const files = value as File[];
        files.forEach((file: File) => formData.append("photos", file));
      } else if (Array.isArray(value)) {
        // Non-file arrays must be serialized; FormData has no native array type,
        // so the server JSON.parses this back.
        formData.append(key, JSON.stringify(value));
      } else {
        // FormData.append only accepts string | Blob, so coerce everything else
        // (numbers, booleans) to string. The server casts them back via the schema.
        formData.append(key, String(value));
      }
    });

    // The backend derives property ownership from this ID, not from the JWT,
    // so we must attach it explicitly as a body field.
    formData.append("managerCognitoId", authUser.cognitoInfo.userId);

    const result = await createProperty(formData);
    if (!("error" in result)) {
      router.push("/managers/properties");
    }
  };

  return (
    <div className="dashboard-container">
      <Header
        title="Add New Property"
        subtitle="Create a new property listing with detailed information"
      />

      <div className="bg-white rounded-xl p-6 shadow-sm">
        <FormProvider {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-10">
            {/* ── 1. Basic Information ───────────────────────────── */}
            <section>
              <SectionHeader step={1} title="Basic Information" />
              <div className="space-y-4 mt-4">
                <CustomFormField name="name" label="Property Name" />
                <CustomFormField
                  name="description"
                  label="Description"
                  type="textarea"
                />
              </div>
            </section>

            <SectionDivider />

            {/* ── 2. Fees ───────────────────────────────────────── */}
            <section>
              <SectionHeader step={2} title="Fees" />
              <div className="space-y-4 mt-4">
                <CustomFormField
                  name="pricePerMonth"
                  label="Price per Month ($)"
                  type="number"
                />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <CustomFormField
                    name="securityDeposit"
                    label="Security Deposit ($)"
                    type="number"
                  />
                  <CustomFormField
                    name="applicationFee"
                    label="Application Fee ($)"
                    type="number"
                  />
                </div>
              </div>
            </section>

            <SectionDivider />

            {/* ── 3. Property Details ───────────────────────────── */}
            <section>
              <SectionHeader step={3} title="Property Details" />
              <div className="space-y-6 mt-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <CustomFormField name="beds" label="Beds" type="number" />
                  <CustomFormField name="baths" label="Baths" type="number" />
                  <CustomFormField
                    name="squareFeet"
                    label="Square Feet"
                    type="number"
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <CustomFormField
                    name="isPetsAllowed"
                    label="Pets Allowed"
                    type="switch"
                  />
                  <CustomFormField
                    name="isParkingIncluded"
                    label="Parking Included"
                    type="switch"
                  />
                </div>
                <CustomFormField
                  name="propertyType"
                  label="Property Type"
                  type="select"
                  options={enumToOptions(PropertyTypeEnum)}
                />
              </div>
            </section>

            <SectionDivider />

            {/* ── 4. Amenities & Highlights ─────────────────────── */}
            <section>
              <SectionHeader step={4} title="Amenities & Highlights" />
              <div className="space-y-4 mt-4">
                <CustomFormField
                  name="amenities"
                  label="Amenities"
                  type="select"
                  options={enumToOptions(AmenityEnum)}
                />
                <CustomFormField
                  name="highlights"
                  label="Highlights"
                  type="select"
                  options={enumToOptions(HighlightEnum)}
                />
              </div>
            </section>

            <SectionDivider />

            {/* ── 5. Photos ─────────────────────────────────────── */}
            <section>
              <SectionHeader step={5} title="Photos" />
              <div className="mt-4">
                <CustomFormField
                  name="photoUrls"
                  label="Property Photos"
                  type="file"
                  accept="image/*"
                />
              </div>
            </section>

            <SectionDivider />

            {/* ── 6. Location ───────────────────────────────────── */}
            <section>
              <SectionHeader step={6} title="Location" />
              <div className="space-y-4 mt-4">
                <CustomFormField name="address" label="Street Address" />
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <CustomFormField name="city" label="City" />
                  <CustomFormField name="state" label="State" />
                  <CustomFormField name="postalCode" label="Postal Code" />
                </div>
                <CustomFormField name="country" label="Country" />
              </div>
            </section>

            {/* ── Actions ───────────────────────────────────────── */}
            <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                className="rounded-md"
                disabled={isCreating}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-primary-700 text-white min-w-36 rounded-md"
                disabled={isCreating}
              >
                {isCreating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  "Create Property"
                )}
              </Button>
            </div>
          </form>
        </FormProvider>
      </div>
    </div>
  );
};

const SectionHeader = ({ step, title }: { step: number; title: string }) => (
  <div className="flex items-center gap-3">
    <span className="flex items-center justify-center w-7 h-7 rounded-full bg-primary-100 text-primary-700 text-xs font-bold shrink-0">
      {step}
    </span>
    <h2 className="text-base font-semibold text-gray-900">{title}</h2>
  </div>
);

const SectionDivider = () => (
  <div className="border-t border-gray-100" role="separator" />
);

export default NewProperty;
