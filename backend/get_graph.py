import osmnx as ox
import pandas as pd

print("Starting to fetch walking network for University of Florida...")

# 1. Get the graph for the UF walking network.
# This single line queries OSM, downloads the data,
# and builds a topologically correct graph.
# 'network_type="walk"' automatically includes footways, paths, pedestrians, etc.
G = ox.graph_from_place("University of Florida", network_type="walk")

print("Graph data fetched and built.")

# 2. Convert the graph nodes and edges into GeoDataFrames (like tables)
gdf_nodes, gdf_edges = ox.graph_to_gdfs(G)

# --- 3. Format and Save nodes.csv ---

# The node DataFrame's index is the node_ID. We reset it to be a column.
# We also rename the columns to match your 'nodes.csv' spec.
nodes_df = gdf_nodes.reset_index().rename(columns={
    'osmid': 'node_ID',
    'y': 'latitude',
    'x': 'longitude'
})

# Keep only the columns you specified
final_nodes = nodes_df[['node_ID', 'latitude', 'longitude']]

# Save to CSV
final_nodes.to_csv('nodes.csv', index=False)
print("nodes.csv written successfully.")


# --- 4. Format and Save edges.csv ---

# The edge DataFrame's index has the source and destination nodes.
# We reset it to make them columns.
edges_df = gdf_edges.reset_index().rename(columns={
    'u': 'source_node_ID',
    'v': 'destination_node_ID'
})

# Keep only the columns you specified
# This automatically includes edges in both directions for two-way paths.
final_edges = edges_df[['source_node_ID', 'destination_node_ID']]

# Save to CSV
final_edges.to_csv('edges.csv', index=False)
print("edges.csv written successfully.")

print("All done.")